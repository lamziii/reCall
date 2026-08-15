# Recall — Backend Boundaries (Cloud Functions classification)

> Written for the Next.js cutover phase (2026-08-14). Classifies every exported Firebase Function so
> we know what stays event-driven, what stays Firebase-hosted for now, and what could later become a
> Next.js Route Handler. **Nothing is being moved in this phase** — this is the decision record.

Classification key:
- **A — Keep as Firebase event/trigger.** Event-driven; there is no HTTP request to serve, so a Next
  Route Handler is not even applicable.
- **B — Keep temporarily (Firebase-hosted HTTPS).** Works today; moving it now buys nothing, or its
  runtime profile (long-running / background / retries) is a poor fit for a web request handler.
- **C — Candidate for a Next.js Route Handler later.** Request/response tied to the web app; a move
  would improve architectural coherence. Still not urgent.

---

## A — Keep as Firebase event/trigger (do not move)

| Function | Event | Purpose |
|---|---|---|
| `onWorkspaceCreated` | `onDocumentCreated workspaces/{id}` | Auto-enroll the owner as the first member. |
| `onWorkspaceUpdated` | `onDocumentUpdated workspaces/{id}` | Stamp `updated_at`. |
| `onSessionUpdated` | `onDocumentUpdated sessions/{id}` | Stamp `updated_at`. |
| `onSessionReviewUpdated` | `onDocumentUpdated session_reviews/{id}` | Stamp `updated_at`. |
| `onProjectUpdated` | `onDocumentUpdated projects/{id}` | Stamp `updated_at`. |
| `onTaskUpdated` | `onDocumentUpdated tasks/{id}` | Stamp `updated_at`. |
| `onInviteCreated` | `onDocumentCreated workspace_invites/{id}` | React to a new invite (email delivery seam). |

- **Invocation:** Firestore triggers, fired by database writes. No HTTP surface.
- **Auth/authz:** runs as admin (trusted); no per-request token — the triggering write was already
  rules-checked client-side.
- **Secrets:** none (Admin SDK only).
- **Streaming/timeout:** n/a; short.
- **Event semantics:** at-least-once delivery, idempotent by design (deterministic ids / field stamps).
- **Recommendation:** **stay in Firebase permanently.** App Router has no equivalent to Firestore
  triggers. If Firestore is ever replaced, these become the new datastore's change-stream handlers.

---

## B — Keep temporarily, Firebase-hosted HTTPS

### `transcribeSession` — **strongest keep**
- **Purpose:** transcribe a session's audio (OpenAI `gpt-4o-transcribe-diarize`, Speechmatics for
  diarization), chunk long recordings, run the correction pass, write `{transcript,segments,speakers}`.
- **Invocation:** HTTPS `onRequest`.
- **Auth:** Firebase ID token (`verifyIdToken`); **workspace membership** verified against
  `workspaces/{ws}/members/{uid}`.
- **Secrets:** `OPENAI_API_KEY`, `SPEECHMATICS_API_KEY`.
- **Streaming:** no. **Timeout: 3600s (1 hour), memory 1GiB.**
- **Recommendation:** **keep in Functions.** This is a long-running background workload (chunked audio,
  provider retries). A normal Next.js request handler (esp. serverless/Vercel) cannot run for an hour;
  forcing it there would harm reliability. If it ever moves, it belongs on a queue/worker, not a page handler.

### `extractSessionReview`
- **Purpose:** build a speaker-labeled transcript, call Claude (Structured Outputs), write
  `session_reviews/{sessionId}`.
- **Invocation:** HTTPS `onRequest` (default timeout 60s).
- **Auth:** ID token + workspace membership (identical to transcribeSession; returns the same response
  for a missing session and a non-member, so existence isn't leaked).
- **Secrets:** `ANTHROPIC_API_KEY`.
- **Streaming:** no. Timeout: default.
- **Recommendation:** **keep for now; C-eligible later.** A single Claude call fits a Route Handler,
  but there's no benefit to moving it before the AI/transcription pipeline is otherwise stable.

### `benchmarkTranscription`
- **Purpose:** internal tool comparing transcription providers (accuracy/latency).
- **Invocation:** HTTPS `onRequest`, timeout 300s, memory 512MiB.
- **Auth:** ID token required (auth-gated). Internal `/dev/transcription-benchmark` only.
- **Secrets:** `OPENAI_API_KEY`, `SPEECHMATICS_API_KEY`.
- **Recommendation:** **keep in Functions.** Internal-only; no product value in moving it.

---

## C — Candidate for a Next.js Route Handler later (not now)

### `recallAiChat`
- **Purpose:** the Recall AI assistant. Retrieves bounded workspace context, builds an
  injection-hardened system prompt, streams Claude's answer.
- **Invocation:** HTTPS `onRequest`, **SSE streaming**, timeout 120s, memory 512MiB.
- **Auth:** ID token + workspace membership. Anthropic key stays server-side.
- **Secrets:** `ANTHROPIC_API_KEY`.
- **Recommendation:** **best long-term Route Handler candidate** — a Next Route Handler can stream SSE
  (return a `ReadableStream`), which would co-locate the assistant with the app and drop one CORS
  surface. **Keep on Firebase this phase**; moving it requires re-homing context-retrieval + the
  system prompt and re-validating workspace isolation and prompt-injection defenses. High-value, but
  do it deliberately as its own task, not during cutover.

### `transcribeVoice`
- **Purpose:** short single-speaker voice → text for the Recall AI composer. Writes nothing.
- **Invocation:** HTTPS `onRequest`, timeout 120s, memory 512MiB.
- **Auth:** ID token (no workspace needed — it just transcribes a snippet).
- **Secrets:** `OPENAI_API_KEY`.
- **Recommendation:** **cleanest first candidate to move** (short, stateless request/response). Still
  needs the OpenAI key server-side — fine in a Route Handler. Low risk, low urgency.

---

## Guiding rule

Next.js exists here for architectural coherence, **not** to force every workload through one runtime.
Event triggers and long-running/background jobs (`transcribeSession`) stay in Firebase. Only
request/response endpoints tied to the web app (`transcribeVoice`, then `recallAiChat`,
`extractSessionReview`) are candidates — moved one at a time, each with its own auth + workspace-
isolation re-verification. Any endpoint that must trust a caller-supplied `workspaceId` must keep
verifying membership server-side, wherever it is hosted.
