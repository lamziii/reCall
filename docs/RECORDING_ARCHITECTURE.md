# Recording Architecture

How a session goes from microphone to AI Session Review, and where the seams are for a future
diarizing transcription provider.

```
Microphone
  → MediaRecorder (audio/webm)              [browser]  use-audio-recorder.ts
  → Web Speech API (live transcript)        [browser]  use-speech-recognition.ts
  → TranscriptSegment[] + SessionSpeaker[]  [browser]  data/live/speakers.ts
  → Firestore session + Cloud Storage audio [browser]  data/live/live-store.ts
  → extractSessionReview (auth + membership) [server]  functions/src/extractSessionReview.ts
  → buildLabeledTranscript(segments,speakers)[server]  functions/src/transcription/labeled-transcript.ts
  → Claude, Structured Outputs               [server]  functions/src/generateSessionReview.ts
  → session_reviews/{sessionId}              [server]
  → live review UI (onSnapshot)              [browser]  pages/app/session-review-live.tsx
```

## Client recording flow (`pages/app/record-live.tsx`)

1. **Session info** — title, type (Meeting / Investor Conversation / …), project, participants, notes.
2. **Start Recording** — `useAudioRecorder` (getUserMedia → MediaRecorder, timer, AnalyserNode for
   the visualizer) + `useSpeechRecognition` (Web Speech, auto-restarts on the ~60s browser cutoff).
3. **Stop & process** — finalize the audio Blob; convert Web Speech segments to `TranscriptSegment[]`
   (`finalizedToSegments`) with a generic `Speaker 1`; derive the roster (`defaultSpeakers`); create
   the Firestore session (id generated first); upload audio to
   `workspaces/{workspaceId}/recordings/{sessionId}.webm` (best-effort — the transcript is the AI
   source, so an upload failure does not block analysis); navigate to the review with
   `state.autostart` so analysis kicks off automatically.

Import Transcript is the same page's secondary path: paste (or load the investor fixture), create
the session, analyze. It is the fallback for microphone/Web-Speech failure, older meetings, and
testing — deliberately less prominent than Start Recording.

## Transcription provider seam (`functions/src/transcription/`)

- `types.ts` — `TranscriptionProvider`, `TranscriptSegment`, `SessionSpeaker`, `TranscriptionResult`.
- `browser-adapter.ts` — today's path: the browser supplies the transcript, so `transcribe()` is a
  no-op placeholder. **The browser path does NOT do reliable speaker diarization.**
- `labeled-transcript.ts` — `buildLabeledTranscript(plain, segments, speakers)` turns segments +
  the speaker mapping into a `Name: text` transcript for Claude, merging consecutive same-speaker
  turns. Pure + self-checked (`node lib/transcription/labeled-transcript.js`).

The server prefers a labeled transcript built from `segments`/`speakers` when present, and falls
back to the plain `transcript` string (import path) — fully back-compatible with the original
`{ session_id, transcript }` contract.

## Speaker differentiation

Web Speech cannot separate speakers, so segments carry generic `Speaker 1` labels. The review
page's **Speakers** panel lets the user map `Speaker N → a real name`; the mapping is saved on the
session and, if a review already exists, analysis re-runs so Claude sees the names. Claude is
instructed to attribute turns by label but never to invent a real identity for a generic label.

`SessionSpeaker` = `{ id, label, displayName: string | null, participantId?: string | null }`.

## Adding real server-side diarization (future — not required today)

1. Pick one provider and add its key as a Firebase Functions secret (never a `VITE_` var):
   `DEEPGRAM_API_KEY` (nova-3, `diarize=true`, `utterances=true`) or `ASSEMBLYAI_API_KEY`
   (`speaker_labels=true`).
2. Implement `TranscriptionProvider.transcribe({ audioPath, sessionId, workspaceId, language })`:
   download the audio from Storage, call the provider, map its response to
   `TranscriptionResult` (segments with real `speakerId`/`speakerLabel` + word timestamps).
3. In `extractSessionReview` (or a new `processSession` function), when audio exists and no
   client transcript is trusted, call the provider, persist the segments/speakers on the session,
   then feed `buildLabeledTranscript` → `generateSessionReview` exactly as today.

No frontend or review-UI change is required — the review already renders whatever segments/speakers
the session carries. Do not add a provider dependency until one is intentionally selected, and do
not require an OpenAI key unless OpenAI is deliberately chosen as the provider.
