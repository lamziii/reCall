# Recall — Environment Configuration

> Authoritative list of environment variables for the Next.js app (`web/`) and the Firebase Functions
> backend (`firebase/functions/`). **No real secret values live in this file or in git.** Written for
> the Next.js cutover (2026-08-14).

## The one rule

`NEXT_PUBLIC_*` variables are **inlined into the browser bundle** — treat them as public. Everything
else is server-only. **Never** put an AI/provider key, Admin credential, or billing/webhook secret in
a `NEXT_PUBLIC_*` variable. (Verified this build: a scan of `web/.next/static` found no server-secret
identifiers and no `firebase-admin` in the client graph.)

---

## 1. Public — browser (`web/.env.local`, prefix `NEXT_PUBLIC_`)

These identify the Firebase project to public Firebase APIs. They are **not secrets** — access is
enforced by Firestore/Storage Security Rules, not by hiding them. Safe to ship. Defaults for the real
project are baked into `web/src/lib/env.ts`, so these are only needed to point at a different project.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key (public identifier). |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project id. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender id. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App id. |
| `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION` | Region for Cloud Function URLs (default `us-central1`). |
| `NEXT_PUBLIC_FIREBASE_EXTRACT_REVIEW_URL` | Override for the extractSessionReview URL (else derived). |
| `NEXT_PUBLIC_FIREBASE_TRANSCRIBE_URL` | Override for transcribeSession. |
| `NEXT_PUBLIC_FIREBASE_TRANSCRIBE_VOICE_URL` | Override for transcribeVoice. |
| `NEXT_PUBLIC_FIREBASE_RECALL_AI_URL` | Override for recallAiChat (SSE). |
| `NEXT_PUBLIC_FIREBASE_BENCHMARK_URL` | Override for benchmarkTranscription. |
| `NEXT_PUBLIC_RECALL_VOICE_MODE` | `openai` (default) or `browser` for the AI composer voice input. |
| `NEXT_PUBLIC_USE_EMULATORS` | `true` routes Auth/Firestore/Storage/Functions to the emulator suite (dev only). |
| `NEXT_PUBLIC_RECALL_DEMO` | Demo/sample-data mode — see §3. **Must be false/unset in production.** |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL for `metadataBase` (OG/Twitter image resolution). |

Function URLs are derived from region + project id when not overridden, so in most deployments only
the six core Firebase values (or none, using the baked defaults) are required.

---

## 2. Server secrets — NEVER `NEXT_PUBLIC_`

Live only in the Functions runtime (`firebase/functions/.env` locally, or deploy env / Secret Manager
in production). They never reach the Next app or the browser.

| Variable | Used by | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `extractSessionReview`, `recallAiChat`, correction pass | Claude. Prefer Secret Manager in prod. |
| `ANTHROPIC_MODEL` | same | Model override (non-secret, but server-side). |
| `OPENAI_API_KEY` | `transcribeSession`, `transcribeVoice`, `benchmarkTranscription` | OpenAI transcription. |
| `OPENAI_TRANSCRIPTION_MODEL` | transcription | Defaults to `gpt-4o-transcribe-diarize`. |
| `SPEECHMATICS_API_KEY` | transcription (diarizing provider) | Optional alternate provider. |
| `TRANSCRIPT_CORRECTION` | correction pass | `off` disables the Claude code-switch correction. |
| `OPENAI_*` chunking knobs | `transcription/config.ts` | Segment/concurrency/retry tuning (non-secret). |
| `FIREBASE_SERVICE_ACCOUNT` / `GOOGLE_APPLICATION_CREDENTIALS` | `web/src/server/firebase/admin.ts` | **Future** server-admin seam; unused today. Server-only. |
| billing / webhook secrets | future | Not implemented yet; when added, server-only. |

The Next app's `src/server/firebase/admin.ts` imports `server-only`, so any accidental client import
fails the build — a compile-time guard against leaking Admin credentials.

---

## 3. Demo vs production data boundary (Step 9 decision)

Recall has a **sample/localStorage data layer** (`web/src/data/workspace-repository.ts` + per-feature
`*-service.ts`) that still backs the un-wired areas (Projects, Reviews, Notifications, People, Teams).

**Decision:** demo mode is an **explicit, dev/test-only** build flag — `NEXT_PUBLIC_RECALL_DEMO`
(migrated from `VITE_RECALL_DEMO`). Resolution lives in one place (`getDataMode()` in
`data/live/data-mode.ts`):

- **Production:** `NEXT_PUBLIC_RECALL_DEMO` unset/false → `live` mode → real Firestore only. The
  sample layer is never seeded in the running app.
- **Demo/local:** `NEXT_PUBLIC_RECALL_DEMO=true` → `demo` mode → localStorage sample workspace, no auth.

There is **deliberately no automatic fallback** from live → demo on error: a broken live path surfaces
an honest error, it never silently renders sample data as if it were real. Deploy configs must not set
`NEXT_PUBLIC_RECALL_DEMO=true`. Data-layer migration of the sample-backed areas is a **separate product
task**, not part of this framework cutover.

---

## Files
- `web/.env.example` — copy to `web/.env.local`, fill as needed (public values only).
- `firebase/functions/.env` — server secrets (gitignored); or Secret Manager in production.
