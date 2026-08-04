// Transcription architecture (server side). Today the transcript arrives from the browser
// (Web Speech API) via extractSessionReview, so the "provider" is a passthrough. The interface
// exists so a real diarizing provider (Deepgram / AssemblyAI / …) can be dropped in later
// WITHOUT changing session processing — see browser-adapter.ts and RECORDING_ARCHITECTURE.md.

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerLabel: string; // e.g. "Speaker 1" — generic until a provider or the user assigns a name
  startMs: number;
  endMs: number;
  text: string;
  confidence?: number;
}

export interface SessionSpeaker {
  id: string;
  label: string; // the generic label used in segments, e.g. "Speaker 1"
  displayName: string | null; // a real name once the user maps it; null while unknown
  participantId?: string | null;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptSegment[];
  detectedLanguage?: string;
  durationMs?: number;
}

export interface TranscriptionInput {
  audioPath: string;
  sessionId: string;
  workspaceId: string;
  language?: string;
}

export interface TranscriptionProvider {
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}
