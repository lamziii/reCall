# reCall — Project Context

> ⚠️ **PARTLY STALE — see [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for the current state.** This
> brief (2026-08-02) predates the live wiring: it says the frontend and backend "are not connected
> yet," but Firebase is now installed and the record → review → tasks slice runs against a live
> backend. Kept for narrative context; trust `PROJECT_STATUS.md` where they disagree.

> A catch-up brief for an AI assistant. Read this to understand what reCall is, how it's
> built today, and where we're taking it. Written 2026-08-02.

## What reCall is

reCall turns messy meeting notes, recordings, and transcripts into an AI-organized workspace.
You record or paste a session; an AI extraction step produces a structured **Session Review**
(executive summary, discussion topics, decisions, tasks, timeline, insights, risks, open
questions) and promotes action items into a real, trackable task board. Around that core it
has grown into a small team workspace: sessions, projects, tasks, a calendar, people, teams,
and notifications.

## Origin & current status

- Built by a **3-person team in an ~8-hour hackathon**. It started as a 2-page kanban MVP
  (paste notes → AI extracts tasks → board) and grew well past that.
- **We are now rebuilding it into a production-ready product.** This doc exists to catch a new
  contributor (you) up before that work.
- The backend was **originally Supabase/Postgres, then migrated to Firebase/Firestore** during
  the hackathon. Some older docs still reference Supabase — Firebase is current.

## The single most important fact about the current state

**The frontend and backend are not connected yet.**

- The **frontend is fully built out as a UI** (see route list below) but runs entirely on
  **sample data persisted in `localStorage`**. There is no `firebase` package installed in the
  frontend, no real authentication, and no network calls to the backend.
- The **backend (Firestore schema + Cloud Functions) exists** as code but the app doesn't call
  it. The login/onboarding pages are UI shells, not real auth.

So "make it production-ready" is largely: **wire the existing frontend to the existing Firebase
backend, add real auth, and replace the sample-data layer with live data** — plus hardening.

## Tech stack

**Frontend** (`frontend/`)
- React 19, TypeScript, Vite 8
- Tailwind CSS v4
- react-router-dom v7, framer-motion, lucide-react
- Vitest + Testing Library
- Path alias `@/` → `frontend/src`
- Design system lives under `src/styles/tokens` and `src/components`; there's a dev design
  system page at `/dev/design`.

**Backend** (`firebase/`)
- Firebase: Firestore (database), Cloud Functions (TypeScript), Cloud Storage (audio), Auth
- Cloud Functions: `extractSessionReview`, `generateSessionReview`, plus Firestore `triggers`
  (e.g. auto-enrolling a workspace owner as a member)
- Firestore security rules + composite indexes are defined (`firestore.rules`,
  `firestore.indexes.json`)

**AI**
- **Claude API, Haiku 4.5**, called server-side from a Cloud Function to produce the Session
  Review from a transcript. (Prefer the latest Claude models for the production rebuild.)

**Recording / transcription**
- Browser audio recording (`MediaRecorder`) + Web Speech API for live transcripts, stored to
  Cloud Storage as `.webm`.

## Frontend routes / surfaces

Public (forced dark theme): `/` (landing), `/login`, `/onboarding`, `/dev/design`.

App shell under `/app` (theme-toggleable):
- `/app` — home dashboard
- `/app/sessions`, `/app/sessions/:id` — session list + Session Review detail (the AI tabs)
- `/app/record` — record a new session (audio + live transcript)
- `/app/projects`, `/app/projects/:id`
- `/app/tasks` — the actionable task board
- `/app/calendar`
- `/app/reviews`
- `/app/people`, `/app/people/:id`
- `/app/teams`, `/app/teams/:id`
- `/app/search`, `/app/notifications`, `/app/settings`

Each surface has a `src/data/<feature>/` folder with a service + hooks that today read from the
localStorage sample workspace via `src/data/workspace-repository.ts`. That repository was
deliberately written to expose "the same read/write/clear shape a real API-backed repository
would expose later" — it's the seam to swap for live Firebase.

## Data model (the contracts)

Authoritative sources:
- `docs/CONTRACTS.md` — frontend/API-facing field shapes (partially stale; Firebase schema wins)
- `firebase/FIREBASE_SCHEMA.md` — the Firestore collections (source of truth for the DB layer)
- `docs/CONTRACT_CHANGES.md` — changelog for contract changes

Key collections: `workspaces` (+ `members` subcollection), `sessions`, `session_reviews`
(1:1 with a session — the review doc's ID *is* the session ID), `tasks`, `projects`,
`documents`, `notifications`.

Two important, easily-confused shapes:
- **`session_reviews.tasks`** — raw AI-extracted *candidate* tasks shown in the review's Tasks
  tab. No status/workflow.
- **`tasks` collection (Contract 2)** — the persisted, actionable task the board/calendar read
  from. Promoting a candidate = creating a `tasks` row, not editing the review array.

Task field conventions worth knowing: `priority` is `"red" | "amber" | "gray"` (color stored
directly, not high/med/low); `status` is `"todo" | "in_progress" | "done"` (underscore);
`deadline` is an ISO `YYYY-MM-DD` string or `null` (frontend renders `null` as "No deadline");
`owner` defaults to `"Unassigned"`, never null.

The `extractSessionReview` Cloud Function: `POST { session_id, transcript }` with an
`Authorization: Bearer <Firebase ID token>` header → `{ session_review }` or `{ error }`. It
verifies the token and checks workspace membership before responding.

## What "production-ready" needs (the actual work ahead)

Not yet decided/planned in detail — this is the gap, not a committed roadmap:

1. **Real auth** — wire Firebase Auth into the frontend; replace the login/onboarding shells.
2. **Live data** — install/configure the Firebase web SDK, swap `workspace-repository` (and the
   per-feature services) from localStorage sample data to Firestore reads/writes; keep sample
   data as an optional seed/demo mode.
3. **Connect recording → backend** — upload audio to Storage, persist the session, call
   `extractSessionReview`, render the real review.
4. **Fill contract gaps** — `docs/CONTRACTS.md` is missing written contracts for `workspaces`,
   `workspace_members`, `sessions`, `documents`, `projects`, `notifications` (schema exists,
   contract text doesn't).
5. **Hardening** — security rules review, error handling, loading/empty states on live data,
   input validation at the trust boundary (Cloud Functions), tests against real data flows.

## Repo layout

```
reCall/
├── docs/         planning docs + data contracts (some Supabase-era references are stale)
├── frontend/     React + Vite + Tailwind app (built UI, localStorage sample data)
├── firebase/     Firestore schema, rules, indexes, Cloud Functions (TS), storage rules
├── api/          legacy Person B scaffolding (superseded by firebase/functions)
├── database/     legacy Supabase-era schema (superseded by Firestore)
└── supabase/     legacy Supabase config (superseded by Firebase)
```

`api/`, `database/`, and `supabase/` are **legacy from before the Firebase migration** — treat
`firebase/` as current.
