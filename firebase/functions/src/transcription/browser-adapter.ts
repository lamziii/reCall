import type { TranscriptionProvider, TranscriptionResult } from "./types";

/**
 * Today's transcript is produced client-side by the browser Web Speech API and sent up with the
 * request, so there is no server-side speech-to-text to run. This passthrough provider exists to
 * satisfy the TranscriptionProvider seam; session processing never actually calls transcribe()
 * for the browser path — it uses the client-supplied segments directly.
 *
 * IMPORTANT: the browser path does NOT do reliable speaker diarization. Segments carry generic
 * "Speaker N" labels; real speaker separation comes from a future server provider (below).
 */
export const browserTranscriptionProvider: TranscriptionProvider = {
  async transcribe(): Promise<TranscriptionResult> {
    throw new Error(
      "browserTranscriptionProvider.transcribe is not used — the browser supplies the transcript with the request.",
    );
  },
};

// TODO (future diarization): implement a server-side provider that downloads the audio from
// Storage (input.audioPath) and calls a diarizing STT API for word timestamps + speaker turns.
// Choose ONE provider and add its key as a Firebase Functions secret — NEVER a VITE_ var:
//   - Deepgram      → secret DEEPGRAM_API_KEY   (nova-3, diarize=true, utterances=true)
//   - AssemblyAI    → secret ASSEMBLYAI_API_KEY (speaker_labels=true)
// Map the provider response into TranscriptionResult (segments with real speakerId/speakerLabel),
// then feed buildLabeledTranscript() → generateSessionReview() exactly as the browser path does.
// See RECORDING_ARCHITECTURE.md. Do not add a provider dependency until one is intentionally
// selected, and do not require an OpenAI key unless OpenAI is deliberately chosen.
