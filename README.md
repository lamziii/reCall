# reCall

Recall turns a recorded or pasted conversation into a structured, trackable workspace. You record a
session (or import a transcript); an AI step produces a **Session Review** — summary, decisions,
tasks, timeline, insights, risks, and open questions — and you can promote action items onto a real
task board.

Started as a hackathon 2-page kanban MVP; now a Firebase-backed workspace app with a live
record → AI review → tasks flow. (The backend was originally Supabase, migrated to Firebase.)

## Start here

1. **[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)** — the audited single source of truth for
   what actually exists today (features, wiring, limitations). **Read this first.**
2. [`docs/README.md`](docs/README.md) — index of all documentation.
3. [`docs/DEMO_SETUP.md`](docs/DEMO_SETUP.md) — run the live AI slice locally.

## Repo layout

```
reCall/
├── docs/        all planning, architecture, contract, design, and demo docs — start here
├── frontend/    React 19 + Vite + Tailwind app (UI + data layer)
├── firebase/    Firestore schema/rules/indexes, Storage rules, Cloud Functions (current backend)
├── api/         legacy pointer → firebase/functions (superseded)
├── database/    legacy pointer → firebase/ (superseded)
└── supabase/    legacy Supabase Edge Function (dead; pre-Firebase migration)
```
