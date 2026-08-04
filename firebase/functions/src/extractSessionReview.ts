import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";
import { generateSessionReview } from "./generateSessionReview";
import { isAiConfigured } from "./aiEnvironment";
import { syncSessionTasks } from "./sessionArtifacts";
import { buildLabeledTranscript } from "./transcription/labeled-transcript";
import type { SessionSpeaker, TranscriptSegment } from "./transcription/types";

// The Anthropic key is read server-side from process.env (firebase/functions/.env locally, or
// the deploy environment in production) via aiEnvironment.ts — never sent to the client. This
// needs NO Secret Manager and NO Blaze plan for local dev. For a hardened PRODUCTION deploy,
// prefer Secret Manager: add `const anthropicKey = defineSecret("ANTHROPIC_API_KEY")` (from
// "firebase-functions/params") and pass `{ secrets: [anthropicKey] }` to onRequest. See DEMO_SETUP.md.

// Defensive normalizers — never trust client-supplied segment/speaker shapes.
function normalizeSegments(raw: unknown): TranscriptSegment[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const segs = raw
    .filter((s) => s && typeof s === "object")
    .map((s, i) => {
      const o = s as Record<string, unknown>;
      return {
        id: typeof o.id === "string" ? o.id : String(i),
        speakerId: typeof o.speakerId === "string" ? o.speakerId : "s1",
        speakerLabel: typeof o.speakerLabel === "string" ? o.speakerLabel : "Speaker 1",
        startMs: typeof o.startMs === "number" ? o.startMs : 0,
        endMs: typeof o.endMs === "number" ? o.endMs : 0,
        text: typeof o.text === "string" ? o.text : "",
      } as TranscriptSegment;
    })
    .filter((s) => s.text.trim().length > 0);
  return segs.length > 0 ? segs : undefined;
}

function normalizeSpeakers(raw: unknown): SessionSpeaker[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const speakers = raw
    .filter((s) => s && typeof s === "object")
    .map((s, i) => {
      const o = s as Record<string, unknown>;
      return {
        id: typeof o.id === "string" ? o.id : `s${i + 1}`,
        label: typeof o.label === "string" ? o.label : `Speaker ${i + 1}`,
        displayName: typeof o.displayName === "string" && o.displayName.trim() ? o.displayName.trim() : null,
      } as SessionSpeaker;
    });
  return speakers.length > 0 ? speakers : undefined;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Transcript guardrails. Too-short is almost certainly a mistake; too-long protects cost and
// the model's context window (a demo transcript is a few KB).
const MIN_TRANSCRIPT_CHARS = 20;
const MAX_TRANSCRIPT_CHARS = 100_000;

function sendError(res: any, status: number, message: string) {
  res.set(CORS_HEADERS).status(status).json({ error: message });
}

// POST /extractSessionReview  { session_id, transcript }
// Requires an Authorization: Bearer <Firebase ID token> header. Returns
// { session_review: {...} } on success, or { error: "..." } — never both, never neither.
// Matches docs/CONTRACTS.md Contract 3.
export const extractSessionReview = onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(CORS_HEADERS).status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    sendError(res, 405, "Method not allowed — use POST.");
    return;
  }

  const { session_id, transcript, segments, speakers } = req.body ?? {};
  if (typeof session_id !== "string" || !session_id) {
    sendError(res, 400, "Request body must include session_id.");
    return;
  }
  if (typeof transcript !== "string") {
    sendError(res, 400, "Request body must include transcript as a string.");
    return;
  }

  const trimmed = transcript.trim();
  if (trimmed.length < MIN_TRANSCRIPT_CHARS) {
    sendError(res, 400, "Transcript is too short to analyze. Add more of the conversation and try again.");
    return;
  }
  if (trimmed.length > MAX_TRANSCRIPT_CHARS) {
    sendError(res, 413, "Transcript is too long. Please shorten it and try again.");
    return;
  }

  const authHeader = req.headers.authorization ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!idToken) {
    sendError(res, 401, "Missing Authorization: Bearer <token> header.");
    return;
  }

  let uid: string;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    sendError(res, 401, "Invalid or expired auth token.");
    return;
  }

  const sessionRef = db.doc(`sessions/${session_id}`);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    sendError(res, 404, "Session not found.");
    return;
  }

  const workspaceId = sessionSnap.data()?.workspace_id as string | undefined;
  if (!workspaceId) {
    sendError(res, 404, "Session not found.");
    return;
  }

  const memberSnap = await db.doc(`workspaces/${workspaceId}/members/${uid}`).get();
  if (!memberSnap.exists) {
    // Same response as a missing session — don't leak existence to non-members.
    sendError(res, 404, "Session not found.");
    return;
  }

  // Config check only after authorization succeeds (don't leak config state to strangers, and
  // never call Anthropic before this point). Key-free, development-friendly message.
  if (!isAiConfigured()) {
    logger.error("extractSessionReview: ANTHROPIC_API_KEY missing", { session_id, workspace_id: workspaceId });
    sendError(res, 503, "AI processing is not configured for the local Functions runtime.");
    return;
  }

  // Build a speaker-labeled transcript when segments/speakers are supplied (recording path);
  // otherwise analyze the plain transcript (import path). Back-compatible with the old contract.
  const normSegments = normalizeSegments(segments);
  const normSpeakers = normalizeSpeakers(speakers);
  const analysisTranscript = buildLabeledTranscript(trimmed, normSegments, normSpeakers);

  // Safe logging: identifiers and size only — never the transcript body (it's private).
  logger.info("extractSessionReview: start", {
    session_id,
    workspace_id: workspaceId,
    uid,
    transcript_chars: trimmed.length,
    segment_count: normSegments?.length ?? 0,
    speaker_count: normSpeakers?.length ?? 0,
  });

  // Mark the session as processing so live listeners can render a processing state.
  await sessionRef.update({ review_status: "processing", updated_at: FieldValue.serverTimestamp() });

  let review;
  try {
    review = await generateSessionReview(analysisTranscript);
  } catch (err) {
    logger.error("extractSessionReview: generation failed", {
      session_id,
      message: err instanceof Error ? err.message : String(err),
    });
    await sessionRef.update({ review_status: "failed", updated_at: FieldValue.serverTimestamp() });
    sendError(res, 502, "Recall couldn't organize this session. Your transcript is saved — please try again.");
    return;
  }

  const reviewRef = db.doc(`session_reviews/${session_id}`);
  const existing = await reviewRef.get();
  const doc = {
    session_id,
    ...review,
    updated_at: FieldValue.serverTimestamp(),
    created_at: existing.exists ? existing.data()?.created_at : FieldValue.serverTimestamp(),
  };
  await reviewRef.set(doc);

  // Canonicalize the review into standalone task records so extracted tasks show up on Tasks / Home /
  // Calendar automatically (root-cause fix). Idempotent + non-destructive — safe on analysis retry.
  let taskSync = { created: 0, updated: 0, skipped: 0 };
  try {
    const sessionTitle = (sessionSnap.data()?.title as string | undefined)?.trim() || "Untitled session";
    const projectId = (sessionSnap.data()?.project_id as string | undefined) ?? null;
    taskSync = await syncSessionTasks({ sessionId: session_id, workspaceId, sessionTitle, projectId, review });
  } catch (err) {
    // Task fan-out is best-effort: the review is already saved. Log and continue so a tasks-write
    // hiccup never fails the whole analysis (the user can retry analysis to re-sync).
    logger.error("extractSessionReview: task sync failed", { session_id, message: err instanceof Error ? err.message : String(err) });
  }

  // Denormalize the summary + counts onto the session so the list / Home / Calendar render rich rows
  // without an extra per-row review read.
  await sessionRef.update({
    review_status: "completed",
    review_summary: review.executive_summary,
    tasks_count: review.tasks.length,
    decisions_count: review.decisions.length,
    updated_at: FieldValue.serverTimestamp(),
  });

  const saved = await reviewRef.get();
  logger.info("extractSessionReview: done", { session_id, ...taskSync });
  res.set(CORS_HEADERS).status(200).json({ session_review: { id: saved.id, ...saved.data() } });
});
