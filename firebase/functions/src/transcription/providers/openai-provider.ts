// OpenAI transcription provider (SERVER-ONLY). POST /v1/audio/transcriptions.
//
// PRIMARY model gpt-4o-transcribe-diarize: returns speaker-labeled segments with timestamps
// (response_format=diarized_json, chunking_strategy=auto for audio >30s). Speakers come back as
// "A"/"B"/… — we map them to generic "Speaker N" (the user renames them on the review page).
// NOTE: the diarize model does NOT accept `language` or `prompt`, so vocabulary biasing only
// applies on the fallback path.
//
// FALLBACK model gpt-4o-transcribe: plain multilingual text (no diarization). Used when the
// diarize call fails or when the caller disables diarization. Supports `language` + `prompt`
// (Albanian vocabulary bias).
//
// Both are strong on Albanian / mixed Albanian+English. Key read from OPENAI_API_KEY, never leaves
// the server. Model overrides: OPENAI_TRANSCRIBE_MODEL (primary), OPENAI_TRANSCRIBE_FALLBACK_MODEL.
import * as logger from "firebase-functions/logger";
import type { NormalizedTranscript, TranscriptionProvider, TranscriptionRequest } from "../provider";
import { diarizedToSegments } from "../normalize";
import { finalizeTranscript } from "../language-metrics";
import { withTimeout } from "../http";

const TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
// Model names come from env so switching models needs NO code change. Both the OPENAI_TRANSCRIPTION_*
// and the older OPENAI_TRANSCRIBE_* names are accepted (the former wins); defaults otherwise.
const PRIMARY_MODEL =
  process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || "gpt-4o-transcribe-diarize";
const FALLBACK_MODEL =
  process.env.OPENAI_TRANSCRIPTION_FALLBACK_MODEL?.trim() || process.env.OPENAI_TRANSCRIBE_FALLBACK_MODEL?.trim() || "gpt-4o-transcribe";
const RATE_PER_MIN = Number(process.env.OPENAI_STT_RATE_PER_MIN) || 0.006; // ~list price; comparison only
// A long meeting's transcription is a single slow request — allow well past the 60s shared default
// (the function itself runs up to 300s). Overridable for tuning.
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TRANSCRIBE_TIMEOUT_MS) || 240_000;

interface DiarizedResponse {
  duration?: number;
  text?: string;
  segments?: Array<{ speaker?: string; text?: string; start?: number; end?: number }>;
}

function extFor(contentType: string): string {
  const t = contentType.toLowerCase();
  if (t.includes("mp4") || t.includes("m4a") || t.includes("aac")) return "m4a";
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("wav")) return "wav";
  if (t.includes("ogg")) return "ogg";
  return "webm";
}

function fileField(req: TranscriptionRequest): [string, Blob, string] {
  return ["file", new Blob([req.audio], { type: req.mimeType || "audio/webm" }), `audio.${extFor(req.mimeType || "")}`];
}

async function postForm(apiKey: string, form: FormData): Promise<Response> {
  return withTimeout(
    (signal) => fetch(TRANSCRIBE_URL, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form, signal }),
    OPENAI_TIMEOUT_MS,
  );
}

/** PRIMARY: diarizing transcription. Throws on any non-2xx so the caller can fall back. */
async function transcribeDiarized(apiKey: string, req: TranscriptionRequest): Promise<NormalizedTranscript> {
  const started = Date.now();
  const form = new FormData();
  form.append(...fileField(req));
  form.append("model", PRIMARY_MODEL);
  form.append("response_format", "diarized_json");
  form.append("chunking_strategy", "auto"); // required for audio longer than 30s (real meetings)

  const res = await postForm(apiKey, form);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI diarize ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as DiarizedResponse;
  const turns = (data.segments ?? []).map((s) => ({ speaker: s.speaker, text: s.text ?? "", startSec: s.start ?? 0, endSec: s.end ?? 0 }));
  const { segments: rawSegments, speakers } = diarizedToSegments(turns);
  const rawText = (data.text ?? rawSegments.map((s) => s.text).join(" ")).trim();
  // LOCAL pass: four-language metrics + Albanian-exonym spelling bias (the diarize model ignores
  // `language`, so this is where prioritization actually happens).
  const { text, segments, metrics } = finalizeTranscript({ text: rawText, segments: rawSegments, logContext: { model: PRIMARY_MODEL } });
  const durationSeconds = data.duration ?? req.durationHintSeconds;

  return {
    provider: "openai",
    model: PRIMARY_MODEL,
    detectedLanguage: metrics.predominant !== "unknown" ? metrics.predominant : req.language,
    languageMetrics: metrics,
    durationSeconds,
    text,
    segments,
    speakers,
    diarized: speakers.length > 0,
    processingTimeMs: Date.now() - started,
    estimatedCost: durationSeconds ? (durationSeconds / 60) * RATE_PER_MIN : undefined,
    rawResponse: { model: PRIMARY_MODEL, segmentCount: segments.length },
  };
}

/** FALLBACK: plain multilingual text, no diarization. Supports language + vocabulary prompt. */
async function transcribePlain(apiKey: string, req: TranscriptionRequest): Promise<NormalizedTranscript> {
  const started = Date.now();
  const form = new FormData();
  form.append(...fileField(req));
  form.append("model", FALLBACK_MODEL);
  form.append("response_format", "json");
  // OpenAI accepts ONE supported ISO-639-1 code (no list param); omit to auto-detect.
  if (req.language) form.append("language", req.language);
  if (req.vocabulary?.length) form.append("prompt", `Terminology: ${req.vocabulary.slice(0, 120).join(", ")}.`);

  const res = await postForm(apiKey, form);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI STT ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { text?: string };
  const durationSeconds = req.durationHintSeconds;
  // LOCAL pass: four-language metrics + Albanian-exonym spelling bias.
  const { text, metrics } = finalizeTranscript({ text: (data.text ?? "").trim(), segments: [], logContext: { model: FALLBACK_MODEL } });

  return {
    provider: "openai",
    model: FALLBACK_MODEL,
    detectedLanguage: metrics.predominant !== "unknown" ? metrics.predominant : req.language,
    languageMetrics: metrics,
    durationSeconds,
    text,
    segments: [],
    speakers: [],
    diarized: false,
    processingTimeMs: Date.now() - started,
    estimatedCost: durationSeconds ? (durationSeconds / 60) * RATE_PER_MIN : undefined,
    rawResponse: { model: FALLBACK_MODEL },
  };
}

export const openaiProvider: TranscriptionProvider = {
  name: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY?.trim()),

  async transcribe(req: TranscriptionRequest): Promise<NormalizedTranscript> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

    // Diarization requested (default): try the diarize model, fall back to plain text on failure.
    if (req.enableDiarization !== false) {
      try {
        return await transcribeDiarized(apiKey, req);
      } catch (err) {
        logger.warn("openai-provider: diarize failed, falling back to plain transcription", {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return transcribePlain(apiKey, req);
  },
};
