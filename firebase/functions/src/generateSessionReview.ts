import Anthropic from "@anthropic-ai/sdk";
import { REVIEW_JSON_SCHEMA, normalizeReview, type SessionReview } from "./reviewSchema";
import { getAiEnvironment } from "./aiEnvironment";

export type { SessionReview } from "./reviewSchema";

// Lazily-created singleton Anthropic client (server-side only). The key/model come from
// getAiEnvironment() → firebase/functions/.env locally, or the deploy env in production.
let cachedClient: Anthropic | null = null;
function getClient(apiKey: string): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

const SYSTEM_PROMPT = `You are Recall's meeting-analysis engine. You read a raw meeting transcript and return a single structured Session Review.

Rules:
- Ground every item in the transcript. Do NOT invent owners, deadlines, decisions, participant names, or project names that were not actually stated or clearly implied.
- When a task has no clear owner, set "owner" to null (do not guess a name). When no date was stated, set "deadline" to null.
- "deadline" must be an ISO date (YYYY-MM-DD) or null — never free text like "next week".
- Task "priority" is exactly one of "red" (urgent/blocking), "amber" (normal), "gray" (low / nice-to-have). Choose based on how the task was discussed; default to "amber".
- For decisions, tasks, risks, and questions, put a short verbatim-ish transcript snippet in "evidence" when one exists, else null.
- Every array may be empty if the transcript genuinely contains nothing of that kind. Prefer an empty array over a fabricated entry.
- Keep the executive_summary to 2-4 sentences of plain text.
- Transcript lines may be prefixed with a speaker label (e.g. "Speaker 1:" or a name like "Alex:"). Use these to attribute who said what, but do NOT assume a generic "Speaker N" label corresponds to any named participant unless a name is explicitly used in the transcript. Never invent a speaker's real identity.`;

function extractJson(text: string): unknown {
  // With output_config.format the response is already pure JSON, but stay defensive in case
  // a model wraps it — grab the outermost object.
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model response was not valid JSON.");
  }
}

// Person B's seam. Calls Claude server-side (key never leaves the server) and returns a
// validated, defaulted SessionReview. Throws on transport/parse failure — the caller
// (extractSessionReview) turns that into a user-safe error and a "failed" session status.
export async function generateSessionReview(transcript: string): Promise<SessionReview> {
  // Throws a key-free error if ANTHROPIC_API_KEY is missing (caught by the caller).
  const { apiKey, model } = getAiEnvironment();
  const client = getClient(apiKey);

  // output_config.format (Structured Outputs) is sent on the wire but isn't in this SDK
  // version's params type yet, so build the body untyped and cast the result to Message.
  const params = {
    model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: REVIEW_JSON_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Analyze this meeting transcript and produce the Session Review.\n\n<transcript>\n${transcript}\n</transcript>`,
      },
    ],
  };
  const response = (await client.messages.create(params as any)) as Anthropic.Messages.Message;

  if ((response.stop_reason as string) === "refusal") {
    throw new Error("Model declined to process this transcript.");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text content.");
  }

  return normalizeReview(extractJson(textBlock.text));
}
