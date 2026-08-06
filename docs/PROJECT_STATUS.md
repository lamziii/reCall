/co# Recall — Project Status

> **Single source of truth for the current state of Recall.** Written from a full audit of the
> repository on **2026-08-04**. It documents *what actually exists in the code*, not the roadmap
> and not what older docs claim. Where an older doc disagrees with the code, the code wins and the
> discrepancy is called out here.

---

## Project Overview

**Recall turns a recorded or pasted conversation into a structured, trackable workspace.**

You record a session (or paste/import a transcript); an AI step produces a **Session Review** —
executive summary, discussion topics, decisions, candidate tasks, timeline, insights, risks, and
open questions — and you can promote any candidate task onto a real, trackable task board.

Around that core the app has grown a team-workspace surface: a home dashboard, sessions, tasks, a
calendar, projects, people, teams, reviews, notifications, search, and settings.

- **Purpose:** kill the "what did we actually decide, and who owns what?" gap after every meeting.
- **Vision:** an AI meeting recorder that hands you decisions and action items automatically, then
  tracks them.
- **Main user flow (the working vertical slice):** sign in → **Start Session** → record or import a
  transcript → server transcribes/analyzes it with Claude → the Session Review appears in realtime →
  promote a task → it shows on the Tasks board. This flow is **fully wired to a live backend.**

### Origin

Built by a 3-person team in an ~8-hour hackathon as a 2-page kanban MVP (paste notes → AI extracts
tasks → board), then grown well past that scope. The backend was **originally Supabase/Postgres,
migrated to Firebase/Firestore.** It is now being hardened toward a production-ready product.

---

## Tech Stack

**Frontend** (`frontend/`)
- React 19 + TypeScript, Vite 8
- Tailwind CSS v4
- react-router-dom v7, framer-motion, lucide-react, class-variance-authority
- Firebase Web SDK v12 (auth, firestore, storage, functions) — **installed and wired**
- Vitest + Testing Library (behavior/accessibility tests co-located with components)
- Path alias `@/` → `frontend/src`

**Backend** (`firebase/`)
- Firebase: Firestore (DB), Cloud Functions (TypeScript, Node 20), Cloud Storage (audio), Auth
- Cloud Functions: `extractSessionReview`, `transcribeSession`, `benchmarkTranscription`, plus
  Firestore triggers (`onWorkspaceCreated` auto-enroll + `updated_at` stampers)
- Security Rules (`firestore.rules`), composite indexes (`firestore.indexes.json`), storage rules

**AI / transcription**
- **Claude** (Anthropic SDK, Structured Outputs) called server-side to generate the Session Review.
  Model configurable via `ANTHROPIC_MODEL` (defaults documented as `claude-haiku-4-5`).
- **OpenAI `gpt-4o-transcribe`** called server-side (`transcribeSession`) for multilingual
  transcription (no diarization). Browser **Web Speech API** is the alternate live-transcript path.
- A pluggable transcription-provider layer (`functions/src/transcription/`) with OpenAI and
  Speechmatics providers, a registry, language metrics, and an Albanian vocabulary aid.

**Legacy (superseded, still in the repo)**
- `api/`, `database/` — original Person B / Person C scaffolding (now just pointer READMEs)
- `supabase/` — pre-migration Supabase Edge Function (dead code)

---

## Folder Structure

```
reCall/
├── docs/            All planning, architecture, contract, design, and demo docs (this folder)
├── frontend/        React + Vite + Tailwind app (the entire UI + data layer)
│   └── src/
│       ├── app/         App root, shell (sidebar/topbar), theme provider
│       ├── components/  ~150-component reusable library (see src/components/README.md)
│       ├── data/        Per-feature data layer — services + hooks (live Firestore + sample)
│       │   ├── live/    Firestore store, mappers, workspace bootstrap/context, demo fixtures
│       │   └── sample/  localStorage sample-workspace generator (used by tests only)
│       ├── lib/         firebase/*, auth/*, utils
│       ├── pages/       app/ (product pages), dev/ (design system + benchmark), home/login/onboarding
│       ├── routes/      Route definitions
│       └── styles/      Design tokens + animation presets
├── firebase/        Firestore schema/rules/indexes, Storage rules, Cloud Functions (TS + built JS)
├── api/             Legacy pointer → firebase/functions
├── database/        Legacy pointer → firebase/
└── supabase/        Legacy Supabase Edge Function (dead)
```

---

## Features

Four buckets: **Completed**, **Partially Complete**, **Not Started / Not Wired**, **Experimental**.

> **The single most important fact for reading this section:** the app defaults to **live mode**
> (real Firebase). The old **localStorage sample workspace is only ever seeded inside tests** —
> `generateSampleWorkspace()` is *not* called anywhere in the running app. So any page still backed
> only by the sample layer shows an **empty state permanently** in the real app, regardless of
> whether its Firestore schema exists. Those pages are marked "Not wired" below.

### ✅ Completed

**Design system & component library**
- ~150 reusable components across primitives, layout, forms, data-display, feedback, navigation,
  overlays, and Recall-specific components; design tokens (color, type, spacing, radius, shadow,
  motion, z-index); Framer Motion presets.
- Live showcase at `/dev/design` (20 sections). Behavior/a11y tests co-located.
- Files: `frontend/src/components/**`, `frontend/src/styles/**`, `frontend/src/pages/dev/design/**`.

**Theme switching**
- Light / dark / system, persisted per device; public pre-auth routes forced dark.
- Files: `frontend/src/app/theme/**`, `frontend/src/pages/app/settings.tsx`.

**Real authentication (Firebase Auth)**
- Google sign-in (popup with automatic full-page-redirect fallback) + email/password sign-up/in.
  `RequireAuth` gates `/app`; `RedirectIfAuthed` bounces signed-in users off `/login`.
- Files: `frontend/src/lib/auth/**`, `frontend/src/lib/firebase/auth.ts`, `frontend/src/pages/login/index.tsx`.

**Workspace bootstrap**
- On entering `/app`, a workspace is derived deterministically from the user's uid (`ws-<uid>`),
  created if absent, and the owner self-enrolled as a member (idempotent across refreshes). A Cloud
  Function trigger is a redundant backstop.
- Files: `frontend/src/data/live/workspace-bootstrap.ts`, `workspace-context.tsx`,
  `firebase/functions/src/triggers.ts`, `firebase/firestore.rules`.

**Recording → transcription → AI Session Review (the live vertical slice)**
- Record audio (`MediaRecorder` + AnalyserNode visualizer + timer) with a live Web Speech
  transcript, **or** import/paste a transcript. A Firestore session is created; audio is uploaded to
  Cloud Storage (best-effort, non-blocking).
- Server transcription: `transcribeSession` runs OpenAI `gpt-4o-transcribe`; falls back to the
  browser transcript. `extractSessionReview` verifies the Firebase ID token + workspace membership,
  builds a speaker-labeled transcript, calls Claude with Structured Outputs, and writes
  `session_reviews/{sessionId}`. The review UI updates via `onSnapshot` with processing/failed states.
- Files: `frontend/src/pages/app/record-live.tsx`, `session-review-live.tsx`,
  `frontend/src/data/sessions/use-live-transcription.ts`, `use-live-session-review.ts`,
  `frontend/src/lib/firebase/functions.ts`, `firebase/functions/src/extractSessionReview.ts`,
  `generateSessionReview.ts`, `transcribeSession.ts`, `transcription/**`.

**Session Review page (live)**
- Overview (summary, topics, timeline, insights, risks, questions), Decisions, Transcript (with
  audio playback + Speaker N → name mapping and "Save & re-analyze"), Tasks (promote candidate →
  board task, idempotent via deterministic id).
- Files: `frontend/src/pages/app/session-review-live.tsx`, `frontend/src/components/sessions/**`,
  `frontend/src/data/live/review.ts`, `mappers.ts`, `speakers.ts`.

**Tasks board (live)**
- Realtime task list from Firestore; inline status change writes back and reflects via snapshot.
- Files: `frontend/src/data/tasks/use-tasks-list-data.ts`, `frontend/src/data/live/live-store.ts`,
  `frontend/src/pages/app/tasks.tsx`.

**Home dashboard, Sessions list, Calendar (live)**
- All three subscribe to live sessions/tasks and render aggregated view models.
- Files: `frontend/src/data/home/use-home-dashboard-data.ts`,
  `frontend/src/data/sessions/use-sessions-list-data.ts`,
  `frontend/src/data/calendar/use-calendar-data.ts`, `frontend/src/data/live/dashboard-mappers.ts`.

**Backend infrastructure**
- Firestore Security Rules, composite indexes, Storage rules; Cloud Functions build + deploy config;
  `generateSessionReview` is a **real Claude call** (not a stub — see stale-docs note below).
- Files: `firebase/**`.

**Onboarding — account creation → workspace setup (live)**
- A 7-step funnel: create account (email/password **or** Google), secure account (email verification
  + real TOTP 2FA with honest "pending config" fallback), use cases, workspace, regional preferences
  (4 supported languages incl. Albanian, auto-detected time zone, full searchable country list,
  date/time formats), invite team, review. Creates a real Firebase account, a real Firestore
  workspace (deterministic `ws-<uid>` — no duplication vs the `/app` bootstrap), enrolls the user as
  owner, and persists every step to `users/{uid}` + `workspaces/{ws}`. Saves progress per step and
  **resumes after refresh**; completed users are gated straight to `/app`. Invitations are persisted
  and secured in `workspace_invites` (email delivery is a documented, not-yet-configured seam).
- Files: `frontend/src/pages/onboarding/**`, `frontend/src/data/live/onboarding.ts`,
  `invites.ts`, `use-user-profile.ts`, `workspace-bootstrap.ts`, `frontend/src/lib/auth/**`,
  `firebase/firestore.rules`, `firebase/functions/src/invites.ts`. See
  [ONBOARDING_ARCHITECTURE.md](ONBOARDING_ARCHITECTURE.md) and [AUTHENTICATION.md](AUTHENTICATION.md).

### 🚧 Partially Complete

**Settings** (`/app/settings`)
- Present: real account name/email/avatar (from auth), live workspace name, working appearance
  (theme) control.
- Missing: everything is **read-only** except theme — no editable account, workspace, members,
  or notification settings; no sign-out lives here (it's in the profile menu).
- Files: `frontend/src/pages/app/settings.tsx`.

**Record — demo/audio path** (`/app/record`)
- Present: a full audio-recording experience (visualizer, pause/resume, Web Speech live transcript)
  exists as `DemoRecordSessionPage`, but it only runs in **demo mode**; live mode routes to the
  paste/transcribe flow.
- Missing: the recording path in live mode relies on browser Web Speech (unreliable on Safari) or
  server transcription; the two record UIs have diverged.
- Files: `frontend/src/pages/app/record.tsx` (demo) vs `record-live.tsx` (live).

**Speaker diarization**
- Present: a provider seam (`transcription/`), Speaker N → name mapping + re-analyze in the review.
- Missing: **no real diarization in the production path.** Web Speech yields a single `Speaker 1`;
  `gpt-4o-transcribe` returns no speaker labels. A diarizing provider (Deepgram/AssemblyAI/
  Speechmatics) is designed for but not enabled. See `docs/RECORDING_ARCHITECTURE.md`.

### ❌ Not Started / Not Wired

These pages **exist and are styled** but are not connected to live data — in the default app they
render empty states (or a static placeholder) because the only backing store (the sample workspace)
is never seeded outside tests.

- **Projects** (`/app/projects`, `/app/projects/:id`) — Firestore `projects` schema **exists** but
  the pages read the localStorage sample layer. Not wired to live.
- **Reviews** (`/app/reviews`) — reads the sample layer; not wired to live `session_reviews`.
- **Notifications** (`/app/notifications`) — Firestore `notifications` schema **exists**; page reads
  the sample layer. Not wired to live.
- **People** (`/app/people`, `/app/people/:id`) — **no backend collection at all.** Pure frontend
  concept backed by sample data only.
- **Teams** (`/app/teams`, `/app/teams/:id`) — **no backend collection at all.** Sample data only.
- **Search** (`/app/search`) — a **static placeholder** page (`EmptyRoutePage`); ⌘K command palette
  wiring aside, global search does nothing.
- **Documents** — schema (`documents`) + Storage path convention + rules exist, but there is **no
  upload UI and no Documents tab** in the Session Review.
- **Workspace creation, member invites, billing, sharing, external calendar, email/push delivery** —
  not implemented (some have UI shells in onboarding; no backend).

### 🧪 Experimental / Internal

- **`/dev/design`** — component/design-system showcase. Not a product page.
- **`/dev/transcription-benchmark`** + `benchmarkTranscription` Cloud Function + `language-metrics` —
  internal tool for comparing transcription accuracy/latency. Auth-gated.
- **`/tasks`** — internal shared **development task board** for the two developers (Uvejs & Lorik):
  realtime Firestore (`development_tasks`), atomic reserve/take-over, idempotent seed from this
  doc's remaining work, device-local identity (attribution, not auth). Separate from `/app/tasks`
  (customer meeting actions) and not in the customer sidebar. See
  [DEVELOPMENT_TASKBOARD.md](DEVELOPMENT_TASKBOARD.md).
- **`demo-review-fixture.ts`** — a frozen "good" review kept as an *emergency visual reference only*;
  never substituted for a real request.
- **Speechmatics provider** — implemented alongside OpenAI but OpenAI is the active provider.
- **Sample workspace generator** (`data/sample/**`) — realistic seed data, now used only by tests.
- **Legacy dirs** `api/`, `database/`, `supabase/` — superseded by `firebase/`.

---

## UI Pages

| Page | Route | Status | Notes |
|---|---|---|---|
| Landing | `/` | ✅ Complete | Marketing/entry page, forced dark |
| Login / Sign up | `/login` | ✅ Complete | Real Firebase Auth (Google + email/password) |
| Onboarding | `/onboarding` | ✅ Live | Account creation + workspace setup, persisted, resumable |
| Design system | `/dev/design` | 🧪 Internal | Component showcase, 20 sections |
| Transcription benchmark | `/dev/transcription-benchmark` | 🧪 Internal | Auth-gated dev tool |
| Home dashboard | `/app` | ✅ Live | Aggregates live sessions + tasks |
| Sessions list | `/app/sessions` | ✅ Live | Realtime sessions |
| Session Review | `/app/sessions/:id` | ✅ Live | AI review, transcription, promote tasks, speaker mapping |
| Record / New Session | `/app/record` | ✅ Live / 🚧 demo | Live = paste+transcribe; audio-record UI is demo-mode only |
| Projects | `/app/projects` | ❌ Not wired | Schema exists; page reads sample layer (empty in live) |
| Project detail | `/app/projects/:id` | ❌ Not wired | Same as Projects |
| Tasks | `/app/tasks` | ✅ Live | Realtime board, status updates |
| Calendar | `/app/calendar` | ✅ Live | Live sessions + dated tasks on a month grid |
| Search | `/app/search` | ❌ Placeholder | Static empty page |
| Reviews | `/app/reviews` | ❌ Not wired | Reads sample layer (empty in live) |
| People | `/app/people` | ❌ Not wired | No backend collection; sample only |
| Person detail | `/app/people/:id` | ❌ Not wired | Same as People |
| Teams | `/app/teams` | ❌ Not wired | No backend collection; sample only |
| Team detail | `/app/teams/:id` | ❌ Not wired | Same as Teams |
| Notifications | `/app/notifications` | ❌ Not wired | Schema exists; page reads sample layer |
| Settings | `/app/settings` | 🚧 Partial | Read-only account/workspace; working theme control |

---

## Components

The library is large and, on the whole, **finished and consistent** (tokens, variants, a11y,
co-located tests). Notable groupings under `frontend/src/components/`:

- **Finished, reused everywhere:** `ui/` (dialog, drawer, popover, dropdown, tooltip, sheet…),
  `forms/`, `data-display/`, `feedback/`, `navigation/`, `layout/`, `primitives/`, `typography/`,
  `buttons/`, `links/`.
- **Recall-domain, finished:** `recall/`, `sessions/`, `tasks/`, `recording/`, `projects/`, `home/`.
- **Domain components with no live backend** (render, but only ever fed sample data today):
  `people/`, `teams/`, `reviews/` — usable, just not wired to real data.
- **Duplicate/overlapping to reconcile:** two command surfaces
  (`navigation/command-menu.tsx`, `command-palette.tsx`) and `navigation/search-overlay.tsx` +
  `ui/search-shell.tsx`; `pages/app/empty-route-page.tsx` is used by exactly one route (Search).

Component conventions live in `frontend/src/components/README.md`.

---

## Services

Frontend data layer under `frontend/src/data/` and `frontend/src/lib/`.

| Service | State | Notes |
|---|---|---|
| Auth (`lib/auth`, `lib/firebase/auth`) | ✅ Complete | Real Firebase Auth, context, route guards |
| Live Firestore store (`data/live/live-store.ts`) | ✅ Complete | Subscribe/create/update for sessions, tasks, reviews |
| Cloud Functions client (`lib/firebase/functions.ts`) | ✅ Complete | `requestTranscription`, `requestSessionReview` |
| Storage / audio upload (`data/recording/audio-storage-service.ts`, `lib/firebase/storage`) | ✅ Complete | Best-effort `.webm` upload |
| Recording (`data/recording/use-audio-recorder`, `use-speech-recognition`) | ✅ Complete | Browser capture + Web Speech |
| Workspace bootstrap/context (`data/live/*`) | ✅ Complete | Deterministic, idempotent |
| Live mappers (`data/live/mappers.ts`, `dashboard-mappers.ts`) | ✅ Complete | Firestore docs → view models |
| `workspace-repository.ts` (localStorage) | ⚠️ Legacy / half-migrated | Still backs projects/people/teams/reviews/notifications; never seeded in prod |
| Per-feature services (`data/{projects,people,teams,reviews,notifications}/*`) | ⚠️ Needs migration | localStorage-backed; no live path |
| Sessions/Tasks/Home/Calendar hooks | ✅ Complete (live) | Dual-mode hooks, live branch active |
| Transcription providers (`firebase/functions/src/transcription/*`) | ✅ OpenAI / 🧪 Speechmatics | Registry + provider seam; diarization provider not enabled |

**Server (Cloud Functions):** `extractSessionReview` (✅), `generateSessionReview` (✅ real Claude),
`transcribeSession` (✅ OpenAI), `benchmarkTranscription` (🧪 internal), triggers (✅).

---

## Data Models

Source of truth: [`../firebase/FIREBASE_SCHEMA.md`](../firebase/FIREBASE_SCHEMA.md); frontend/API
field contracts in [`CONTRACTS.md`](CONTRACTS.md).

**Firestore collections (real):**
- `workspaces/{id}` + `members/{userId}` subcollection — multi-tenancy; owner auto-enrolled.
- `sessions/{id}` — recording metadata, transcript, segments/speakers, `review_status`, participants.
- `session_reviews/{sessionId}` — AI output; **doc id == session id** enforces 1:1. Holds
  `executive_summary`, `discussion_topics`, `decisions`, **candidate** `tasks`, `timeline`,
  `insights`, `risks`, `questions`.
- `tasks/{id}` — the actionable board task. `priority` ∈ `red|amber|gray`, `status` ∈
  `todo|in_progress|done`, `deadline` = ISO date or `null`, `owner` defaults `"Unassigned"`. Carries
  `source_review_id`/`source_candidate_index` when promoted (deterministic id = idempotent).
- `projects/{id}` — schema exists; not yet read live by the UI.
- `documents/{id}` — schema + storage paths exist; no UI.
- `notifications/{id}` — schema exists; not yet read live by the UI.

> **Two easily-confused task shapes:** `session_reviews.tasks` are raw AI **candidates** (no
> status/workflow); the `tasks` collection is the persisted, trackable board task. Promoting =
> creating a `tasks` row, not editing the review array.

**Frontend-only models (no backend collection):** `people`, `teams` — TypeScript types + sample data
only (`data/people/types.ts`, `data/teams/types.ts`).

---

## Current Limitations

Honest list of what keeps this from feeling production-ready today:

1. **Half the app is not wired to live data.** Projects, Reviews, Notifications, People, Teams, and
   Search render empty (or placeholder) in the real app because the sample layer is never seeded
   outside tests.
2. **No real diarization** — production transcripts collapse to a single speaker unless names are
   mapped manually.
4. **No Documents feature** despite schema/storage/rules being in place.
5. **Search is a static placeholder.**
6. **Settings is essentially read-only** (only theme is editable).
7. **Two data layers coexist** (`workspace-repository` localStorage vs `live-store` Firestore) — the
   migration is half-done, which is the root cause of #1.
8. **Web Speech reliability** (empty transcript on Safari) — the recording path degrades silently to
   "generate manually."

---

## Technical Debt

- **Legacy directories still present:** `api/`, `database/`, `supabase/` (superseded by `firebase/`).
  `supabase/functions/extract-session-review/index.ts` is dead code.
- **Stale docs contradicting the code** (see next section) — kept for history but must not be trusted
  over this file.
- **Dual/half-migrated data layer** — `workspace-repository.ts` + per-feature localStorage services
  should be retired in favor of live Firestore reads.
- **`generateSampleWorkspace()` is orphaned in production** (imported for its version constant, only
  *called* by tests). Either wire it into an explicit demo mode or move it entirely under test.
- **Overlapping components** — command-menu vs command-palette; search-overlay vs search-shell;
  `empty-route-page` used by a single route.
- **Committed build artifacts** — `firebase/functions/lib/**` (compiled JS) and
  `firebase/firebase-debug.log` are checked in alongside source.
- **Diverged record UIs** — `record.tsx` (demo audio) vs `record-live.tsx` (live paste/transcribe).

---

## Missing Integrations

Only those actually implied by the current codebase:

- **Diarizing transcription provider** (Deepgram / AssemblyAI / Speechmatics) — seam exists, none
  enabled for production. See `docs/RECORDING_ARCHITECTURE.md`.
- **Document storage UI** — backend ready, no client integration.
- **Notification delivery** (email/push) — `notifications` collection only; no delivery channel.
- **External calendar** (e.g. Google Calendar) — the in-app calendar is internal only.
- **Billing / plans** — referenced in product vision, no implementation.
- **Member invites** — onboarding has an invite-members UI shell; no backend.

---

## Stale Docs Called Out (do not trust over this file)

- `docs/RECALL_CONTEXT.md` (2026-08-02) states "the frontend and backend are not connected yet." —
  **Outdated.** Firebase v12 is installed and the record → review → tasks slice is live.
- `api/README.md` and `firebase/README.md` describe `generateSessionReview` as "a stub — Person B's
  to implement." — **Outdated.** It is a real Claude Structured-Outputs call.
- `docs/PROJECT_PLAN.md`, `docs/PERSON_A/B/C_*.md` describe the original 2-page kanban MVP / role
  split and (for B/C) Supabase. **Historical.** Kept for provenance; superseded by this file,
  `CONTRACTS.md`, and `firebase/FIREBASE_SCHEMA.md`.

---

## Where to Go Next

This document is the input for building a prioritized development task list. The obvious themes,
straight from the gaps above:

1. **Finish the localStorage → Firestore migration** for Projects, Notifications, and Reviews (schema
   already exists), then decide People/Teams (design a backend or cut them).
2. **Make onboarding create a real workspace** and carry preferences/invites.
3. **Build Search** and the **Documents** upload/tab.
4. **Enable server-side diarization.**
5. **Make Settings editable.**
6. **Retire the legacy `api/`, `database/`, `supabase/` dirs and the orphaned sample layer.**
