# reCall

reCall turns messy meeting notes or transcripts into an AI-organized kanban action board. A
user pastes notes, an AI extraction step pulls out each task with its owner, deadline, and
priority, and a board appears with cards in seconds.

This repo is being built by a 3-person team during an 8-hour hackathon window:

- **Person A** — Frontend / UI (React + Vite + Tailwind)
- **Person B** — API / AI calling (Supabase Edge Function → Claude API, Haiku 4.5)
- **Person C** — Database & error handling (Supabase Postgres)

## Start here

Everyone joining the project should start in [`docs/`](docs/):

1. [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) — the MVP scope, roles, and hour-by-hour
   timeline for the hackathon.
2. [`docs/CONTRACTS.md`](docs/CONTRACTS.md) — the exact data shapes connecting all three
   roles. This is the single source of truth — read it before writing any code.
3. Your role doc — [`docs/PERSON_A_FRONTEND.md`](docs/PERSON_A_FRONTEND.md),
   [`docs/PERSON_B_API.md`](docs/PERSON_B_API.md), or
   [`docs/PERSON_C_DATABASE.md`](docs/PERSON_C_DATABASE.md).

## Repo layout

```
reCall/
├── docs/        planning docs and contracts — start here
├── frontend/    Person A — React + Vite + Tailwind app
├── api/         Person B — Supabase Edge Function(s)
└── database/    Person C — schema and Supabase helper functions
```

No application code exists yet. This structure is scaffolding only — see each folder's
README and the corresponding doc in `docs/` for what goes there.
