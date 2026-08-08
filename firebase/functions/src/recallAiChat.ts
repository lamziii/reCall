import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "./admin";
import { getAiEnvironment, isAiConfigured } from "./aiEnvironment";
import { getAIContext, type ContextEntity } from "./ai/context-retrieval";
import { buildSystemPrompt } from "./ai/system-prompt";

// POST /recallAiChat  — the Recall AI assistant endpoint.
//   headers: Authorization: Bearer <Firebase ID token>
//   body:    { messages: [{role, content}], workspaceId, context?: { entityType, entityId, route } }
// Streams the assistant's answer back as Server-Sent Events. Same auth + workspace-membership
// checks as extractSessionReview. The Anthropic key stays server-side (getAiEnvironment).
//
// SSE event shapes (one JSON object per `data:` line):
//   { type: "context", entities: [{type,id,title}] }  — sources present in the retrieved context
//   { type: "text", text: "…" }                        — a streamed answer delta
//   { type: "done" }                                   — generation finished
//   { type: "error", code, message }                   — a user-safe error

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Keep the last N turns so follow-ups ("who owns that?") keep their referent without resending an
// unbounded history every request.
const MAX_HISTORY_TURNS = 12;
const MAX_MESSAGE_CHARS = 8000;

// Included Recall AI questions per calendar month, per plan. Mirrors data/plans.ts (functions can't
// import frontend code). Extra questions bought from the Usage page land in `bonus_ai_questions`.
const AI_QUESTION_LIMITS: Record<string, number> = { pro: 100, teams: 200 };
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

let cachedClient: Anthropic | null = null;
function getClient(apiKey: string): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

interface InboundMessage {
  role: "user" | "assistant";
  content: string;
}

function sendEvent(res: any, payload: unknown) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sanitizeMessages(raw: unknown): InboundMessage[] {
  if (!Array.isArray(raw)) return [];
  const msgs: InboundMessage[] = [];
  for (const m of raw) {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    const content = typeof m?.content === "string" ? m.content.slice(0, MAX_MESSAGE_CHARS) : "";
    if (role && content.trim()) msgs.push({ role, content });
  }
  // Drop leading assistant turns so the first message is always a user turn.
  while (msgs.length && msgs[0].role === "assistant") msgs.shift();
  return msgs.slice(-MAX_HISTORY_TURNS);
}

export const recallAiChat = onRequest({ timeoutSeconds: 120, memory: "512MiB" }, async (req, res) => {
  res.set(CORS_HEADERS);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed — use POST." });
    return;
  }

  // These are read before we switch the response into SSE mode, so failures return normal JSON.
  if (!isAiConfigured()) {
    res.status(503).json({ error: "Recall AI is not configured on the server." });
    return;
  }

  const authHeader = req.headers.authorization ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!idToken) {
    res.status(401).json({ error: "Missing Authorization: Bearer <token> header." });
    return;
  }
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(idToken)).uid;
  } catch {
    res.status(401).json({ error: "Invalid or expired auth token." });
    return;
  }

  const body = (req.body ?? {}) as Record<string, any>;
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  if (!workspaceId) {
    res.status(400).json({ error: "Missing workspaceId." });
    return;
  }
  const messages = sanitizeMessages(body.messages);
  if (!messages.length) {
    res.status(400).json({ error: "No messages to answer." });
    return;
  }

  // Membership check — never trust the client-supplied workspaceId. Same rule as extractSessionReview.
  const workspaceRef = db.doc(`workspaces/${workspaceId}`);
  const [member, wsSnap] = await Promise.all([workspaceRef.collection("members").doc(uid).get(), workspaceRef.get()]);
  if (!member.exists) {
    res.status(403).json({ error: "You don't have access to this workspace." });
    return;
  }

  // Monthly question limit (plan + purchased top-ups). Enforced here, before we spend any tokens.
  const ws = (wsSnap.data() ?? {}) as Record<string, any>;
  const plan = ws.plan === "teams" ? "teams" : "pro";
  const month = monthKey();
  const limit = (AI_QUESTION_LIMITS[plan] ?? AI_QUESTION_LIMITS.pro) + (Number(ws.bonus_ai_questions) || 0);
  const used = Number(ws.ai_usage?.[month]) || 0;
  if (used >= limit) {
    res.status(402).json({
      error: `You've used all ${limit} Recall AI questions for this month. Add more from Usage → Recall AI questions.`,
    });
    return;
  }

  const rawContext = (body.context ?? {}) as Record<string, any>;
  const current = {
    type: typeof rawContext.entityType === "string" ? rawContext.entityType : null,
    id: typeof rawContext.entityId === "string" ? rawContext.entityId : null,
  };

  // Retrieve a bounded, workspace-scoped context package.
  let contextText = "";
  let entities: ContextEntity[] = [];
  try {
    const ctx = await getAIContext(db, workspaceId, current);
    contextText = ctx.text;
    entities = ctx.entities;
  } catch (err) {
    logger.warn("recallAiChat: context retrieval failed, answering without workspace context", {
      workspace_id: workspaceId,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  // Switch to SSE. Anything after this point reports errors as SSE events, not HTTP status codes.
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.status(200);
  if (typeof (res as any).flushHeaders === "function") (res as any).flushHeaders();

  // Send the source manifest first so the UI can render/link citations as text streams in.
  sendEvent(res, { type: "context", entities });

  const { apiKey, model } = getAiEnvironment();
  const client = getClient(apiKey);
  const stream = client.messages.stream({
    model,
    max_tokens: 2048,
    system: buildSystemPrompt(contextText),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  // Cancel generation if the client disconnects (user closed the panel / pressed Stop).
  const onClose = () => {
    try {
      stream.abort();
    } catch {
      /* ignore */
    }
  };
  req.on("close", onClose);

  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        sendEvent(res, { type: "text", text: event.delta.text });
      }
    }
    const final = await stream.finalMessage();
    if ((final.stop_reason as string) === "refusal") {
      sendEvent(res, { type: "error", code: "refusal", message: "Recall AI couldn't answer that one." });
    } else {
      // Count the question only when it was actually answered.
      await workspaceRef.update({ [`ai_usage.${month}`]: FieldValue.increment(1), updated_at: FieldValue.serverTimestamp() }).catch(() => {});
      sendEvent(res, { type: "done" });
    }
  } catch (err) {
    if ((err as any)?.name === "AbortError") {
      // Client cancelled — nothing to report.
    } else if (err instanceof Anthropic.RateLimitError) {
      const retryAfter = Number(err.headers?.get?.("retry-after")) || undefined;
      logger.warn("recallAiChat: rate limited", { workspace_id: workspaceId });
      sendEvent(res, { type: "error", code: "rate_limit", message: "Recall AI is busy right now. Try again in a moment.", retryAfter });
    } else {
      logger.error("recallAiChat: generation failed", {
        workspace_id: workspaceId,
        detail: err instanceof Error ? err.message : String(err),
      });
      sendEvent(res, { type: "error", code: "server", message: "Recall couldn't answer that just now." });
    }
  } finally {
    req.off?.("close", onClose);
    res.end();
  }
});
