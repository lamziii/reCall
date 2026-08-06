# Recall Documentation

Start with **[`PROJECT_STATUS.md`](PROJECT_STATUS.md)** — the single, audited source of truth for
what actually exists in the project today (features, wiring, limitations, tech debt). Every other
doc here is either a live reference or historical context; where any of them disagree with the code,
`PROJECT_STATUS.md` and the code win.

## Status (start here)

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** — complete current-state audit. **Read this first.**

## Architecture

- [RECALL_CONTEXT.md](RECALL_CONTEXT.md) — narrative catch-up brief. ⚠️ Partly stale (claims the
  frontend/backend are unconnected; they are connected — see PROJECT_STATUS).
- [RECORDING_ARCHITECTURE.md](RECORDING_ARCHITECTURE.md) — mic → transcript → AI review pipeline and
  the diarization-provider seam.
- [../firebase/FIREBASE_SCHEMA.md](../firebase/FIREBASE_SCHEMA.md) — Firestore collections, field
  rules, indexes. **Source of truth for the database layer.** (Lives next to the Firebase config it
  documents.)

## Auth & onboarding

- [ONBOARDING_ARCHITECTURE.md](ONBOARDING_ARCHITECTURE.md) — the 7-step account-creation → workspace
  setup flow: steps, workspace creation (no duplicates), save/resume, invitations.
- [AUTHENTICATION.md](AUTHENTICATION.md) — auth providers, provider branching, route guards, 2FA
  status (pending Firebase config), invite-email delivery status.
- [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md) — pointer to the full schema (in `firebase/`) + an
  at-a-glance collection table.

## Internal tooling

- [DEVELOPMENT_TASKBOARD.md](DEVELOPMENT_TASKBOARD.md) — the `/tasks` shared dev backlog (Uvejs &
  Lorik): realtime Firestore, atomic reservations, idempotent seed. Distinct from `/app/tasks`.

## Contracts

- [CONTRACTS.md](CONTRACTS.md) — data shapes shared across frontend/API/DB. ⚠️ Partially stale;
  Firebase schema wins where they differ.
- [CONTRACT_CHANGES.md](CONTRACT_CHANGES.md) — changelog of contract changes (incl. the
  Supabase → Firebase migration).

## Operations (demo / setup)

- [DEMO_SETUP.md](DEMO_SETUP.md) — how to run the live AI slice (local emulator path + deployed path).
- [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) — how to drive the live demo, with recovery steps.

## Planning (historical)

Original hackathon planning docs. Kept for provenance; superseded by `PROJECT_STATUS.md`.

- [PROJECT_PLAN.md](PROJECT_PLAN.md) — the original 2-page kanban MVP scope + 8-hour timeline.
- [PERSON_A_FRONTEND.md](PERSON_A_FRONTEND.md) — frontend role doc.
- [PERSON_B_API.md](PERSON_B_API.md) — API/AI role doc. ⚠️ Describes the old `extract-tasks` endpoint.
- [PERSON_C_DATABASE.md](PERSON_C_DATABASE.md) — database role doc. ⚠️ Describes the old Supabase MVP.

## Design system

- [Design/](Design/) — design philosophy, principles, tokens, color, typography, layout, motion,
  icons/accessibility, and the component roadmap (files `00`–`09`).

## READMEs kept next to their code (not moved here, by design)

Package/folder-scoped READMEs stay put so their relative links and CLI expectations keep working:

- [../README.md](../README.md) — repo entry point
- [../frontend/README.md](../frontend/README.md) — frontend app + scripts
- [../frontend/src/components/README.md](../frontend/src/components/README.md) — component library guide
- [../firebase/README.md](../firebase/README.md) — Firebase setup + deploy
- `../api/README.md`, `../database/README.md` — legacy pointers to `firebase/`
