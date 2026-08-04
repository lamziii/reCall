// Speechmatics transcription provider (SERVER-ONLY). Speechmatics' batch API supports Albanian
// ("sq") AND speaker diarization AND custom vocabulary — so it's Recall's diarizing provider:
// "who said what", real word timestamps, and Albanian-name accuracy in one pass.
//
// Batch flow (async): submit job (audio + config) → poll status → fetch json-v2 transcript. We
// poll within the function's wall-clock budget; short clips finish in seconds.
// ponytail: long recordings should use Speechmatics notifications (webhook) instead of in-request
// polling — swap pollJob() for a callback + a Firestore write when meeting length grows.
//
// Key read from SPEECHMATICS_API_KEY, never leaves the server. Region override: SPEECHMATICS_URL.
import type { NormalizedTranscript, TranscriptionProvider, TranscriptionRequest } from "../provider";
import { wordsToSegments, type Word } from "../normalize";
import { sleep, withRetry, withTimeout } from "../http";

const BASE_URL = process.env.SPEECHMATICS_URL?.trim() || "https://asr.api.speechmatics.com/v2";
const RATE_PER_MIN = Number(process.env.SPEECHMATICS_RATE_PER_MIN) || 0.0173; // ~enhanced batch list price (~$1.04/hr)
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_MS = Number(process.env.SPEECHMATICS_MAX_POLL_MS) || 110_000;

interface SmWord {
  type: "word" | "punctuation";
  start_time: number;
  end_time: number;
  alternatives?: Array<{ content: string; confidence?: number; speaker?: string }>;
}
interface SmTranscript {
  job?: { duration?: number };
  metadata?: { transcription_config?: { language?: string } };
  results?: SmWord[];
}

function extFor(contentType: string): string {
  const t = contentType.toLowerCase();
  if (t.includes("mp4") || t.includes("m4a") || t.includes("aac")) return "m4a";
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("wav")) return "wav";
  if (t.includes("ogg")) return "ogg";
  return "webm";
}

function authHeader(): string {
  const key = process.env.SPEECHMATICS_API_KEY?.trim();
  if (!key) throw new Error("SPEECHMATICS_API_KEY is not configured.");
  return `Bearer ${key}`;
}

async function submitJob(req: TranscriptionRequest): Promise<string> {
  const config = {
    type: "transcription",
    transcription_config: {
      // Speechmatics takes one primary language per job; default Albanian, English vocab still helps.
      language: req.language || "sq",
      operating_point: "enhanced",
      diarization: req.enableDiarization === false ? "none" : "speaker",
      ...(req.expectedSpeakers ? { speaker_diarization_config: { speaker_sensitivity: 0.5 } } : {}),
      ...(req.vocabulary?.length ? { additional_vocab: req.vocabulary.slice(0, 1000).map((content) => ({ content })) } : {}),
    },
  };

  const form = new FormData();
  form.append("config", JSON.stringify(config));
  form.append("data_file", new Blob([req.audio], { type: req.mimeType || "audio/webm" }), `audio.${extFor(req.mimeType || "")}`);

  const res = await withTimeout((signal) =>
    fetch(`${BASE_URL}/jobs`, { method: "POST", headers: { Authorization: authHeader() }, body: form, signal }),
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Speechmatics submit ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("Speechmatics submit returned no job id.");
  return data.id;
}

async function pollJob(id: string): Promise<void> {
  let waited = 0;
  while (waited < MAX_POLL_MS) {
    const res = await withTimeout((signal) => fetch(`${BASE_URL}/jobs/${id}`, { headers: { Authorization: authHeader() }, signal }));
    if (!res.ok) throw new Error(`Speechmatics status ${res.status}`);
    const status = ((await res.json()) as { job?: { status?: string } }).job?.status;
    if (status === "done") return;
    if (status === "rejected" || status === "deleted") throw new Error(`Speechmatics job ${status}.`);
    await sleep(POLL_INTERVAL_MS);
    waited += POLL_INTERVAL_MS;
  }
  throw new Error("Speechmatics job did not finish within the time budget (recording may be too long).");
}

async function fetchTranscript(id: string): Promise<SmTranscript> {
  const res = await withTimeout((signal) =>
    fetch(`${BASE_URL}/jobs/${id}/transcript?format=json-v2`, { headers: { Authorization: authHeader() }, signal }),
  );
  if (!res.ok) throw new Error(`Speechmatics transcript ${res.status}`);
  return (await res.json()) as SmTranscript;
}

export const speechmaticsProvider: TranscriptionProvider = {
  name: "speechmatics",
  isConfigured: () => Boolean(process.env.SPEECHMATICS_API_KEY?.trim()),

  async transcribe(req: TranscriptionRequest): Promise<NormalizedTranscript> {
    const started = Date.now();
    const jobId = await withRetry(() => submitJob(req));
    await pollJob(jobId);
    const data = await fetchTranscript(jobId);

    const words: Word[] = (data.results ?? []).map((r) => ({
      text: r.alternatives?.[0]?.content ?? "",
      startSec: r.start_time ?? 0,
      endSec: r.end_time ?? 0,
      speaker: r.alternatives?.[0]?.speaker,
      confidence: r.alternatives?.[0]?.confidence,
      isPunctuation: r.type === "punctuation",
    }));
    const { segments, speakers } = wordsToSegments(words);
    const text = segments.map((s) => s.text).join(" ").trim();
    const durationSeconds = data.job?.duration ?? req.durationHintSeconds;

    return {
      provider: "speechmatics",
      model: "speechmatics-enhanced",
      detectedLanguage: data.metadata?.transcription_config?.language ?? req.language,
      durationSeconds,
      text,
      segments,
      speakers,
      diarized: req.enableDiarization !== false && speakers.length > 0,
      processingTimeMs: Date.now() - started,
      estimatedCost: durationSeconds ? (durationSeconds / 60) * RATE_PER_MIN : undefined,
      rawResponse: { job: data.job, resultCount: data.results?.length ?? 0 }, // trimmed — full word list is large
    };
  },
};
