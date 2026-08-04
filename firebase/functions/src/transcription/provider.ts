// Provider-agnostic transcription contract (SERVER-ONLY). Every provider (OpenAI, Speechmatics,
// and future Deepgram/ElevenLabs/Google/self-hosted Whisper) maps its raw response into the same
// NormalizedTranscript so the rest of Recall — session processing and the benchmark tool — never
// depends on a specific vendor. Adding a provider = one file in ./providers + one line in
// ./registry; nothing else changes.
//
// Reuses the session pipeline's TranscriptSegment/SessionSpeaker shapes (startMs/endMs, generic
// "Speaker N" labels) so a diarizing provider's output flows straight into buildLabeledTranscript
// → generateSessionReview with zero downstream changes.
import type { SessionSpeaker, TranscriptSegment } from "./types";
import type { LanguageMetrics } from "./language-metrics";

export type TranscriptionProviderName = "openai" | "speechmatics";

export interface TranscriptionRequest {
  audio: Buffer;
  mimeType: string;
  /**
   * The SINGLE ISO-639-1 hint sent to OpenAI (the API takes no list). One of the officially
   * supported codes — see SUPPORTED_TRANSCRIPTION_LANGUAGES — chosen by pickLanguageHint from the
   * user/workspace/meeting languages, defaulting to Albanian. undefined → provider auto-detects.
   * The real four-language prioritization happens locally after transcription (language-metrics.ts).
   */
  language?: string;
  enableDiarization?: boolean;
  expectedSpeakers?: number;
  /** Domain terms to bias recognition — Albanian names/places/businesses/tech. See ./albanian-vocabulary. */
  vocabulary?: string[];
  /** Optional client-measured duration (seconds) — lets non-duration providers estimate cost. */
  durationHintSeconds?: number;
}

export interface NormalizedTranscript {
  provider: TranscriptionProviderName;
  /** The concrete model that produced this transcript (e.g. gpt-4o-transcribe-diarize) — lets the
   *  UI show which model ran and whether the fallback was used. */
  model?: string;
  detectedLanguage?: string;
  /** Local four-language analysis of the returned text (percentages, predominant). See language-metrics.ts. */
  languageMetrics?: LanguageMetrics;
  durationSeconds?: number;
  text: string;
  segments: TranscriptSegment[];
  speakers: SessionSpeaker[];
  /** Wall-clock the provider call took, for the benchmark comparison. */
  processingTimeMs: number;
  /** Rough USD estimate from duration × a per-minute rate constant — for comparison only, not billing. */
  estimatedCost?: number;
  /** Whether this provider produced real speaker separation on this request. */
  diarized: boolean;
  /** Provider's raw response (truncated before it leaves the server). Never contains the API key. */
  rawResponse?: unknown;
}

export interface TranscriptionProvider {
  name: TranscriptionProviderName;
  /** True when the provider's API key is present in the environment. */
  isConfigured(): boolean;
  transcribe(request: TranscriptionRequest): Promise<NormalizedTranscript>;
}
