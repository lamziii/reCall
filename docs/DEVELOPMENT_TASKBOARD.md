# Development Task Board (`/tasks`)

A minimal, shared, realtime board for tracking the **remaining work to build Recall itself**, split
between the two developers (Uvejs & Lorik). It is an internal tool, not a product feature.

## `/tasks` vs `/app/tasks` — do not confuse them

| | `/tasks` (this doc) | `/app/tasks` |
|---|---|---|
| Purpose | Recall's own dev backlog | Customer meeting action items |
| Audience | Uvejs & Lorik | Recall's end users |
| Firestore collection | `development_tasks` | `tasks` |
| In the app sidebar? | No (internal route) | Yes |
| Identity | Device-local "Uvejs/Lorik" label | The signed-in workspace user |

The two never share data. `/app/tasks` was not modified.

## Route & access

`/tasks` is a top-level route wrapped in `RequireAuth` (any signed-in Firebase user) — it is **not**
inside the `/app` shell and **not** behind `RequireOnboarded`, so a developer can reach it without
completing the customer onboarding. It reuses the Recall theme provider and design system (with a
theme toggle in the header). Firestore security rules were **not weakened** to make it public.

## Identity (attribution, not auth)

On first visit a centered "**Who are you?**" modal offers two fixed choices — **Uvejs** or **Lorik**
(no free text). The choice is stored in `localStorage` under `recall_taskboard_user`, shown in the
header, switchable from the header menu, and remembered across refreshes.

This is **only a task-attribution label — it is not authentication and grants no access.** Real
access is the Firebase session that gates the route. Because it's device-local, it is not (and
cannot be) enforced in security rules.

## Firestore collection: `development_tasks`

```ts
type DevelopmentTask = {
  id: string
  title: string
  description: string | null
  category: 'foundation' | 'onboarding' | 'projects' | 'reviews' | 'notifications' | 'search'
          | 'documents' | 'people' | 'teams' | 'settings' | 'recording' | 'transcription'
          | 'collaboration' | 'integrations' | 'billing' | 'cleanup' | 'testing' | 'other'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'backlog' | 'reserved' | 'in_progress' | 'completed'
  reserved_by: 'uvejs' | 'lorik' | null
  created_by: 'uvejs' | 'lorik' | 'system'   // 'system' for seeded tasks
  completed_by: 'uvejs' | 'lorik' | null
  created_at: Timestamp; updated_at: Timestamp
  reserved_at: Timestamp | null; completed_at: Timestamp | null
  order: number
}
```

Read live via `onSnapshot` (`subscribeDevTasks`), ordered by `order` — a single-field order, so no
composite index is needed.

## Status lifecycle

```
backlog ──Reserve──▶ reserved ──Start──▶ in_progress ──Complete──▶ completed
   ▲                    │  │                  │  │                     │
   └──── Release ───────┘  └── Complete ──────┘  └──── Release ────────┤ (→ backlog)
   └──────────────────────── Reopen ──────────────────────────────────┘
```

- **Reserve** (backlog → reserved): sets `reserved_by = me`, `reserved_at`. **Atomic** (transaction).
- **Start** (reserved → in_progress).
- **Release** (reserved | in_progress → backlog): clears the reservation — anyone can pick it up.
- **Complete** (reserved | in_progress → completed): sets `completed_by`, `completed_at`.
- **Reopen** (completed → backlog): clears completion **and** reservation.
- **Take over**: only via the ⋯ menu on a task held by the *other* person, and only behind a
  confirmation dialog. There is no silent takeover — the primary button shows a disabled
  "Reserved by …" for the other person's tasks.
- **Edit** / **Delete** (delete is confirmed).

## Reservation is atomic

`reserveDevTask` and `takeOverDevTask` run inside a Firestore **transaction**: they re-read the task
and reject if it's already held by someone else (`DevTaskConflictError`) or completed. So if both
developers click **Reserve** on the same task at the same moment, exactly one wins and the other sees
a friendly "Already taken" toast — never a silent overwrite. Every write also stamps `updated_at`.

## Seed system

The board is seeded **once** from the remaining work in [PROJECT_STATUS.md](PROJECT_STATUS.md)
(`SEED_TASKS` in `src/data/dev-tasks/seed-data.ts`). `ensureDevTasksSeeded()`:

- Is guarded by `development_taskboard_meta/initial-seed` (`{ version, seeded_at, seeded_by }`). If
  that doc already exists at the current `SEED_VERSION`, seeding is a no-op.
- Runs inside a transaction so two simultaneous first-visitors can't double-seed.
- Uses **deterministic ids** (`dev-<slug>`) and, on a future additive `SEED_VERSION` bump, reads each
  seed task first and creates only the **missing** ones — so it never overwrites a manually edited or
  completed task. Within a version, deleted tasks are not resurrected.
- Onboarding is complete, so its finished work is **not** seeded — only genuinely-remaining items
  (invite email delivery, invite acceptance page, enabling real 2FA) appear.

## Views, filters, progress

- **Views:** All · Available (unreserved backlog) · Mine (reserved/in-progress by me) · Reserved ·
  In progress · Completed.
- **Filters:** category, priority, person (by `reserved_by`), plus a text search over title/description.
- **Progress row:** total · remaining · in progress · completed · Uvejs reserved · Lorik reserved,
  with a compact bar. Logic is pure and unit-tested (`filters.ts`).

## States

Loading skeleton, empty (no tasks / no filter matches), realtime error with retry, per-task busy
state, reservation-conflict toast. Raw Firebase errors are never shown.

## How Uvejs & Lorik use it

1. Open `/tasks` (sign in if prompted) → pick your name once.
2. Scan **Available**, **Reserve** a task (atomic), **Start** it, **Complete** when done.
3. See each other's changes live; use **Mine** to focus, the person filter to see who's on what.
4. Add ad-hoc tasks with **Add task** (optionally reserve/start immediately).

## Key files

```
src/pages/tasks/index.tsx              page (header, progress, filters, list, dispatch)
src/pages/tasks/identity-dialog.tsx    "Who are you?" popup
src/pages/tasks/task-form-dialog.tsx   add/edit modal
src/pages/tasks/task-row.tsx           one row + lifecycle actions
src/data/dev-tasks/types.ts            model, categories, priorities, users
src/data/dev-tasks/seed-data.ts        initial backlog + SEED_VERSION
src/data/dev-tasks/dev-tasks-store.ts  Firestore CRUD, atomic transitions, idempotent seed
src/data/dev-tasks/filters.ts          views/filters/stats (pure)
src/data/dev-tasks/identity.ts         localStorage attribution
src/data/dev-tasks/use-dev-tasks.ts    realtime hook + one-time seed
firebase/firestore.rules               development_tasks + _meta rules (any authed user)
```

## Security limitations (be honest)

- The Uvejs/Lorik selector is **attribution only**, not authentication.
- `development_tasks` is readable/writable by **any authenticated user** — appropriate for a
  two-person internal tool, and it doesn't touch customer data or weaken existing rules. If this ever
  needs to be locked to specific accounts, add an allowlist check in the rules.
