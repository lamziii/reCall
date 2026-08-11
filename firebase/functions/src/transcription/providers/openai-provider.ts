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
import type { SessionSpeaker, TranscriptSegment } from "../types";
import { diarizedToSegments } from "../normalize";
import { finalizeTranscript } from "../language-metrics";
import { segmentAudio } from "../segment-audio";
import { withTimeout, withRetry } from "../http";
import { TRANSCRIPTION_CONFIG, chunkSecondsForByteCap, mapWithConcurrency } from "../config";

const TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
// Model names come from env so switching models needs NO code change. Both the OPENAI_TRANSCRIPTION_*
// and the older OPENAI_TRANSCRIBE_* names are accepted (the former wins); defaults otherwise.
const PRIMARY_MODEL =
  process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || "gpt-4o-transcribe-diarize";
const FALLBACK_MODEL =
  process.env.OPENAI_TRANSCRIPTION_FALLBACK_MODEL?.trim() || process.env.OPENAI_TRANSCRIBE_FALLBACK_MODEL?.trim() || "gpt-4o-transcribe";
const RATE_PER_MIN = Number(process.env.OPENAI_STT_RATE_PER_MIN) || 0.006; // ~list price; comparison only
// All chunking/concurrency/retry knobs live in ../config (TRANSCRIPTION_CONFIG). OpenAI rejects a
// single request over 1400s (~23min) OR over 25MB — both caps are handled by splitting long
// recordings into chunks that respect BOTH limits, then transcribing each with the same gpt-4o path.
const { targetChunkSeconds: MAX_SEGMENT_SECONDS, maxFileBytes: MAX_TRANSCRIPTION_FILE_BYTES, minChunkSeconds: MIN_SEGMENT_SECONDS, maxConcurrency: CHUNK_CONCURRENCY, maxRetries: CHUNK_MAX_RETRIES, retryBackoffMs: CHUNK_RETRY_BACKOFF_MS } = TRANSCRIPTION_CONFIG;
// A long meeting's transcription is a single slow request — allow well past the 60s shared default.
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

/** One clip (already under the 1400s cap): diarize, then plain text on failure. */
async function transcribeClip(apiKey: string, req: TranscriptionRequest): Promise<NormalizedTranscript> {
  if (req.enableDiarization !== false) {
    try {
      return await transcribeDiarized(apiKey, req);
    } catch (err) {
      // NB: log key is `detail`, not `message` — `message` collides with firebase logger's own
      // structured field and silently drops the error text.
      logger.warn("openai-provider: diarize failed, falling back to plain transcription", {
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return transcribePlain(apiKey, req);
}

/**
 * Stitches per-chunk transcripts back into one. Timestamps are shifted by the running offset (each
 * chunk starts at 0 thanks to -reset_timestamps). Speaker ids are assigned PER request, so the same
 * label in two chunks may be two different people — we relabel each chunk's speakers to globally
 * distinct ids rather than risk merging strangers; the user renames/merges on the review page, just
 * like the single-clip path. Language metrics are recomputed on the full text (finalizeTranscript is
 * idempotent, so re-running it over already-corrected chunks is safe).
 */
function mergeChunks(chunks: NormalizedTranscript[]): NormalizedTranscript {
  const segments: TranscriptSegment[] = [];
  const speakers: SessionSpeaker[] = [];
  const texts: string[] = [];
  let offsetMs = 0;
  let processingTimeMs = 0;
  let estimatedCost = 0;
  let durationSeconds = 0;
  let speakerN = 0;
  let diarized = false;

  for (const c of chunks) {
    if (c.text) texts.push(c.text);
    processingTimeMs += c.processingTimeMs;
    estimatedCost += c.estimatedCost ?? 0;
    diarized = diarized || c.diarized;

    const remap = new Map<string, { id: string; label: string }>();
    for (const sp of c.speakers) {
      speakerN += 1;
      const mapped = { id: `c${speakerN}-${sp.id}`, label: `Speaker ${speakerN}` };
      remap.set(sp.id, mapped);
      speakers.push({ id: mapped.id, label: mapped.label, displayName: null });
    }
    for (const seg of c.segments) {
      const m = remap.get(seg.speakerId);
      segments.push({
        ...seg,
        id: String(segments.length + 1),
        speakerId: m?.id ?? seg.speakerId,
        speakerLabel: m?.label ?? seg.speakerLabel,
        startMs: seg.startMs + offsetMs,
        endMs: seg.endMs + offsetMs,
      });
    }

    const chunkSec = c.durationSeconds ?? MAX_SEGMENT_SECONDS;
    offsetMs += Math.round(chunkSec * 1000);
    durationSeconds += chunkSec;
  }

  const model = chunks[0]?.model;
  const { text, segments: finalSegments, metrics } = finalizeTranscript({
    text: texts.join("\n").trim(),
    segments,
    logContext: { model, chunks: chunks.length },
  });

  return {
    provider: "openai",
    model,
    detectedLanguage: metrics.predominant !== "unknown" ? metrics.predominant : chunks[0]?.detectedLanguage,
    languageMetrics: metrics,
    durationSeconds,
    text,
    segments: finalSegments,
    speakers,
    processingTimeMs,
    estimatedCost: estimatedCost || undefined,
    diarized,
    rawResponse: { chunks: chunks.length, model },
  };
}

export const openaiProvider: TranscriptionProvider = {
  name: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY?.trim()),

  async transcribe(req: TranscriptionRequest): Promise<NormalizedTranscript> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

    // Long recordings exceed OpenAI's per-request caps (1400s AND 25MB), so split them first (ffmpeg
    // stream-copy) into chunks that respect BOTH, then transcribe each with the identical gpt-4o path
    // — multilingual and diarization behave exactly as on a short clip. If splitting isn't possible,
    // fall back to a single whole-file request (still correct for short audio).
    let parts: AudioChunk[];
    try {
      parts = await splitWithinLimits(req.audio, req.mimeType, req.durationHintSeconds);
    } catch (err) {
      logger.warn("openai-provider: audio segmentation unavailable, transcribing whole file", {
        detail: err instanceof Error ? err.message : String(err),
      });
      return transcribeClip(apiKey, req);
    }

    if (parts.length <= 1) {
      const single = await transcribeClip(apiKey, req);
      await Promise.resolve(req.onProgress?.(1, 1)).catch(() => {});
      return single;
    }

    logger.info("openai-provider: long recording split into chunks", {
      chunks: parts.length,
      target_seconds: MAX_SEGMENT_SECONDS,
      max_file_bytes: MAX_TRANSCRIPTION_FILE_BYTES,
      concurrency: CHUNK_CONCURRENCY,
    });

    // Transcribe chunks with controlled concurrency; each chunk retries independently so one
    // transient failure never restarts the others. Progress fires per completed chunk (order-
    // independent) so the UI can show real progress on a multi-hour meeting.
    let completed = 0;
    const results = await mapWithConcurrency(parts, CHUNK_CONCURRENCY, async (part, index) => {
      const clip = await withRetry(
        () => transcribeClip(apiKey, { ...req, audio: part.buffer, durationHintSeconds: part.seconds, onProgress: undefined }),
        CHUNK_MAX_RETRIES,
        CHUNK_RETRY_BACKOFF_MS,
      );
      completed += 1;
      logger.info("openai-provider: chunk done", { chunk: `${index + 1}/${parts.length}`, completed, bytes: part.buffer.length, seconds: part.seconds });
      await Promise.resolve(req.onProgress?.(completed, parts.length)).catch(() => {});
      return clip;
    });
    return mergeChunks(results);
  },
};

interface AudioChunk {
  buffer: Buffer;
  /** The chunk's clip length in seconds — used as a duration hint so merged timestamps stay exact
   *  even on the no-duration plain-text fallback path. */
  seconds: number;
}

/**
 * Splits `audio` into chunks that each respect BOTH the time cap (MAX_SEGMENT_SECONDS) and the byte
 * cap (MAX_TRANSCRIPTION_FILE_BYTES). Picks a byte-aware segment length up front from the measured
 * bitrate, then verifies actual sizes and re-splits any straggler that's still too large (variable
 * bitrate can defeat a pure time split) — halving its segment time until it fits or hits the floor.
 */
async function splitWithinLimits(audio: Buffer, mimeType: string, durationHintSeconds?: number): Promise<AudioChunk[]> {
  const segSeconds = chunkSecondsForByteCap(audio.length, durationHintSeconds, MAX_SEGMENT_SECONDS, MAX_TRANSCRIPTION_FILE_BYTES, MIN_SEGMENT_SECONDS);
  const parts = await segmentAudio(audio, mimeType, segSeconds);
  if (parts.length <= 1 && audio.length <= MAX_TRANSCRIPTION_FILE_BYTES) {
    // Short recording that already fits — one clip, no chunking.
    return [{ buffer: audio, seconds: durationHintSeconds ?? segSeconds }];
  }

  const chunks: AudioChunk[] = [];
  for (const part of parts) {
    if (part.length <= MAX_TRANSCRIPTION_FILE_BYTES) {
      chunks.push({ buffer: part, seconds: segSeconds });
      continue;
    }
    // Oversized despite the time split (high/variable bitrate) — re-split this part smaller.
    let sub = segSeconds;
    let subParts = [part];
    while (subParts.some((p) => p.length > MAX_TRANSCRIPTION_FILE_BYTES) && sub > MIN_SEGMENT_SECONDS) {
      sub = Math.max(MIN_SEGMENT_SECONDS, Math.floor(sub / 2));
      subParts = await segmentAudio(part, mimeType, sub);
    }
    for (const p of subParts) chunks.push({ buffer: p, seconds: sub });
  }
  return chunks;
}

/** ponytail: one runnable self-check for the chunk-merge math — `node lib/transcription/providers/openai-provider.js`. */
if (require.main === module) {
  const assert = require("node:assert") as typeof import("node:assert");
  const chunk = (text: string, startMs: number, endMs: number, durationSeconds: number): NormalizedTranscript => ({
    provider: "openai",
    model: "gpt-4o-transcribe-diarize",
    text,
    segments: [{ id: "1", speakerId: "A", speakerLabel: "Speaker 1", startMs, endMs, text }],
    speakers: [{ id: "A", label: "Speaker 1", displayName: null }],
    durationSeconds,
    processingTimeMs: 10,
    diarized: true,
  });
  const merged = mergeChunks([chunk("hello there", 0, 1000, 60), chunk("goodbye now", 0, 2000, 45)]);
  assert.equal(merged.text.includes("hello there") && merged.text.includes("goodbye now"), true, "text concatenated");
  assert.equal(merged.segments.length, 2, "segments merged");
  assert.equal(merged.segments[0].startMs, 0, "chunk 1 keeps its timestamps");
  assert.equal(merged.segments[1].startMs, 60000, "chunk 2 shifted by chunk 1's duration (60s)");
  assert.equal(merged.segments[1].endMs, 62000, "chunk 2 end shifted too");
  assert.equal(merged.speakers.length, 2, "same raw label across chunks stays 2 distinct speakers");
  assert.notEqual(merged.segments[0].speakerId, merged.segments[1].speakerId, "distinct global speaker ids");
  assert.equal(Math.round(merged.durationSeconds ?? 0), 105, "durations summed (60 + 45)");
  assert.equal(merged.diarized, true, "diarized preserved");
  console.log("openai-provider mergeChunks self-check passed");
}
