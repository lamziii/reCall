import Anthropic from "@anthropic-ai/sdk";
import * as logger from "firebase-functions/logger";
import { getAiEnvironment } from "./aiEnvironment";
import { LANGUAGE_NAMES, SUPPORTED_TRANSCRIPTION_LANGUAGES, type SupportedLanguage } from "./transcription/supported-languages";

// Context-aware multilingual correction pass (SERVER-ONLY), run AFTER OpenAI diarization and BEFORE
// Claude analysis. It fixes phonetic transcription errors caused by rapid Albanian↔English code-
// switching (e.g. "Hello, personal data" → "Hello, përshëndetje") using the surrounding segments,
// the expected meeting languages, and the workspace vocabulary — WITHOUT translating, rewriting, or
// inventing words. Every line is judged with a confidence level; only high-confidence corrections
// are applied (medium is left raw but flagged, low is ignored). On ANY failure the caller keeps the
// raw transcript, so this can only improve the result.

let cachedClient: Anthropic | null = null;
function getClient(apiKey: string): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

/** On by default; set TRANSCRIPT_CORRECTION=off to skip the correction pass entirely. */
export function isCorrectionEnabled(): boolean {
  return (process.env.TRANSCRIPT_CORRECTION?.trim().toLowerCase() || "on") !== "off";
}

export type Confidence = "high" | "medium" | "low";

/** Per-line correction the model returns. `changed` is its own claim; we still verify it differs. */
export interface RawCorrection {
  index: number;
  corrected: string;
  confidence: Confidence;
  changed: boolean;
  reason: string;
}

export interface AppliedCorrection {
  index: number;
  original: string;
  corrected: string;
  confidence: Confidence;
  reason: string;
}

export interface CorrectionResult {
  lines: string[];
  applied: AppliedCorrection[];
  /** Medium-confidence changes we did NOT apply but marked as potentially ambiguous. */
  flaggedCount: number;
  usage?: { inputTokens: number; outputTokens: number };
  estimatedCost?: number;
  model?: string;
  processingMs: number;
}

// ---- Centralized, configurable confidence policy (Part 7) --------------------
function levelSet(env: string | undefined, fallback: Confidence[]): Set<Confidence> {
  const parsed = (env?.split(",").map((s) => s.trim()).filter(Boolean) as Confidence[]) || [];
  return new Set(parsed.length ? parsed : fallback);
}
const APPLY_LEVELS = levelSet(process.env.CORRECTION_APPLY_LEVELS, ["high"]);
const FLAG_LEVELS = levelSet(process.env.CORRECTION_FLAG_LEVELS, ["medium"]);
// Rough Anthropic Sonnet rates for a cost ESTIMATE only (not billing). Override via env.
const COST_PER_1K_INPUT = Number(process.env.CORRECTION_COST_PER_1K_INPUT) || 0.003;
const COST_PER_1K_OUTPUT = Number(process.env.CORRECTION_COST_PER_1K_OUTPUT) || 0.015;

/**
 * PURE: decides the final lines from the raw lines + the model's corrections. Applies only
 * apply-level (high) corrections that actually differ; keeps raw for flagged (medium) and low; and
 * never blanks a non-empty line. Returns the applied corrections + a flagged count for metadata.
 * Line count and order are always preserved. Unit-tested (no network).
 */
export function applyCorrections(rawLines: string[], corrections: RawCorrection[]): {
  lines: string[];
  applied: AppliedCorrection[];
  flaggedCount: number;
} {
  const byIndex = new Map<number, RawCorrection>();
  for (const c of corrections) if (typeof c?.index === "number") byIndex.set(c.index, c);

  const lines: string[] = [];
  const applied: AppliedCorrection[] = [];
  let flaggedCount = 0;

  rawLines.forEach((raw, i) => {
    const c = byIndex.get(i);
    const isRealChange = !!c && c.changed && !!c.corrected?.trim() && c.corrected.trim() !== raw.trim();
    if (isRealChange && APPLY_LEVELS.has(c!.confidence)) {
      lines.push(c!.corrected);
      applied.push({ index: i, original: raw, corrected: c!.corrected, confidence: c!.confidence, reason: c!.reason || "" });
    } else {
      if (isRealChange && FLAG_LEVELS.has(c!.confidence)) flaggedCount++;
      lines.push(raw); // keep raw for medium/low/unchanged — conservative by design
    }
  });

  return { lines, applied, flaggedCount };
}

function systemPrompt(): string {
  return `You are Recall's multilingual transcript corrector. You receive the numbered lines of a real meeting transcript from a speech-to-text model. Speakers rapidly code-switch, primarily between Albanian (sq) and English (en), sometimes German (de) or French (fr).

Your ONLY job: fix phonetic/recognition errors where a word was mis-transcribed into the WRONG language during code-switching — e.g. a spoken Albanian word rendered as similar-sounding English ("përshëndetje" heard as "personal data"). Use the surrounding lines and the provided vocabulary as context.

STRICT RULES:
1. Preserve the languages actually spoken. Do NOT translate any word to another language.
2. Do NOT summarize, paraphrase, add, delete, reorder, merge, or split lines. Fix only clear recognition errors.
3. Do NOT improve grammar, remove filler words, or change punctuation beyond what a correction requires.
4. Do NOT change who is speaking; you never see speaker labels or timestamps — leave the text's structure intact.
5. Do NOT invent words. Only use words that were plausibly spoken.
6. When audio-derived text is ambiguous and context/vocabulary strongly support Albanian, prefer Albanian (correct Albanian spelling, incl. ë/ç: Kosovë, Prishtinë, përshëndetje).
7. Preserve clearly-spoken German or French EXACTLY, even if they are not in the expected languages. Never coerce them into Albanian/English.
8. Leave uncertain text UNCHANGED.
9. Return ONE object per input line, same index, in order. For each: the (possibly unchanged) 'corrected' text, whether you 'changed' it, a 'confidence' of high|medium|low, and a short 'reason' category (e.g. "code-switch-sq", "vocab-name", "spelling", "none").
   - high = you are confident this fixes a real recognition error.
   - medium = plausible but uncertain.
   - low / unchanged = leave as-is.`;
}

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    corrections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          corrected: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          changed: { type: "boolean" },
          reason: { type: "string" },
        },
        required: ["index", "corrected", "confidence", "changed", "reason"],
      },
    },
  },
  required: ["corrections"],
} as const;

export interface CorrectOptions {
  expectedLanguages?: SupportedLanguage[];
  vocabulary?: string[];
  logContext?: Record<string, unknown>;
}

/**
 * Runs the structured correction call and applies it. Throws on transport/parse failure or a bad
 * line count — callers treat a throw as "keep the raw transcript".
 */
export async function correctTranscript(rawLines: string[], opts: CorrectOptions = {}): Promise<CorrectionResult> {
  const started = Date.now();
  if (rawLines.length === 0) return { lines: rawLines, applied: [], flaggedCount: 0, processingMs: 0 };

  const { apiKey, model } = getAiEnvironment();
  const client = getClient(apiKey);

  const expected = (opts.expectedLanguages?.length ? opts.expectedLanguages : (["sq", "en"] as SupportedLanguage[]))
    .map((l) => `${LANGUAGE_NAMES[l]} (${l})`)
    .join(", ");
  const vocab = (opts.vocabulary ?? []).slice(0, 150).join(", ");
  const userText =
    `Supported languages: ${SUPPORTED_TRANSCRIPTION_LANGUAGES.join(", ")}. Expected meeting languages (SOFT preference, not a filter): ${expected}.\n` +
    (vocab ? `Workspace vocabulary (names/places/terms — bias spelling toward these): ${vocab}.\n` : "") +
    `Here are ${rawLines.length} transcript lines (index → text). Return exactly ${rawLines.length} correction objects, one per index, in order.\n\n` +
    JSON.stringify(rawLines.map((text, index) => ({ index, text })));

  const params = {
    model,
    max_tokens: 8000,
    system: systemPrompt(),
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    messages: [{ role: "user", content: userText }],
  };
  const response = (await client.messages.create(params as any)) as Anthropic.Messages.Message;
  if ((response.stop_reason as string) === "refusal") throw new Error("Model declined to correct transcript.");

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Model returned no text content.");

  const parsed = JSON.parse(textBlock.text) as { corrections?: unknown };
  const corrections = parsed.corrections;
  if (!Array.isArray(corrections)) throw new Error("Correction output missing 'corrections' array.");

  const { lines, applied, flaggedCount } = applyCorrections(rawLines, corrections as RawCorrection[]);
  const usage = response.usage ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } : undefined;
  const estimatedCost = usage ? (usage.inputTokens / 1000) * COST_PER_1K_INPUT + (usage.outputTokens / 1000) * COST_PER_1K_OUTPUT : undefined;
  return { lines, applied, flaggedCount, usage, estimatedCost, model, processingMs: Date.now() - started };
}

/** Best-effort wrapper for transcribeSession: logs and returns null on any failure. */
export async function tryCorrectTranscript(rawLines: string[], opts: CorrectOptions = {}): Promise<CorrectionResult | null> {
  try {
    return await correctTranscript(rawLines, opts);
  } catch (err) {
    logger.warn("correctTranscript: correction failed, keeping raw transcript", {
      ...opts.logContext,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/** ponytail: runnable self-check of the PURE apply logic (no API) — `node lib/correctTranscript.js`. */
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");
  const raw = ["Hello, personal data.", "This is fine.", "Vushteri project.", "Guten Morgen."];
  const corrections: RawCorrection[] = [
    { index: 0, corrected: "Hello, përshëndetje.", confidence: "high", changed: true, reason: "code-switch-sq" }, // apply
    { index: 1, corrected: "This is fine.", confidence: "low", changed: false, reason: "none" }, // keep raw
    { index: 2, corrected: "Vushtrri project.", confidence: "medium", changed: true, reason: "vocab-name" }, // flag, keep raw
    { index: 3, corrected: "Guten Morgen.", confidence: "high", changed: false, reason: "none" }, // German preserved
  ];
  const { lines, applied, flaggedCount } = applyCorrections(raw, corrections);
  assert.equal(lines.length, 4, "line count preserved");
  assert.equal(lines[0], "Hello, përshëndetje.", "high-confidence code-switch correction applied");
  assert.equal(lines[1], "This is fine.", "low/unchanged kept raw");
  assert.equal(lines[2], "Vushteri project.", "medium NOT applied — raw kept");
  assert.equal(lines[3], "Guten Morgen.", "clearly German preserved");
  assert.equal(applied.length, 1, "exactly one applied");
  assert.equal(flaggedCount, 1, "one medium flagged");
  // Never blank a non-empty line, even if the model returns empty text.
  const blank = applyCorrections(["keep me"], [{ index: 0, corrected: "  ", confidence: "high", changed: true, reason: "x" }]);
  assert.equal(blank.lines[0], "keep me", "empty correction ignored");
  console.log("correctTranscript applyCorrections self-check passed");
}
