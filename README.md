# reCall

Recall turns a recorded or pasted conversation into a structured, trackable workspace. You record a
session (or import a transcript); an AI step produces a **Session Review** — summary, decisions,
tasks, timeline, insights, risks, and open questions — and you can promote action items onto a real
task board.

Started as a hackathon 2-page kanban MVP; now a Firebase-backed workspace app with a live
record → AI review → tasks flow. (The backend was originally Supabase, migrated to Firebase.)

> **Vite → Next.js migration: COMPLETE.** The Next.js App Router app in `web/` is the sole Recall web
> application. The original Vite app (`frontend/`) has been removed. See
> [`docs/NEXTJS_MIGRATION.md`](docs/NEXTJS_MIGRATION.md) for the migration record.

## Start here

1. **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — the system as it stands (Next.js structure,
   Firebase, AI pipeline, domain seam). **Read this first.**
2. [`docs/PROJECT_RECAP.md`](docs/PROJECT_RECAP.md) / [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
   — product feature state and what's wired vs sample-backed.
3. [`docs/NEXTJS_MIGRATION.md`](docs/NEXTJS_MIGRATION.md) — the Vite → Next.js migration record.
4. [`docs/BACKEND_BOUNDARIES.md`](docs/BACKEND_BOUNDARIES.md) — Cloud Functions classification.
5. [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — environment variables + demo/production boundary.

## Run the Next.js app

```
cd web
cp .env.example .env.local     # public Firebase config (defaults baked in)
npm install
npm run dev                    # http://localhost:3000
```

## Repo layout

```
reCall/
├── docs/        architecture, migration, backend, environment, and product docs — start here
├── web/         Next.js 16 (App Router) app — the sole Recall web application
├── firebase/    Firestore schema/rules/indexes, Storage rules, Cloud Functions (backend)
```

(The legacy `api/`, `database/`, and `supabase/` directories — dead Supabase-era scaffolding — and the
original `frontend/` Vite app were removed once Next.js reached parity.)
