# Contracts

> ⚠️ **PARTIALLY STALE:** The old `extract-tasks` endpoint and `boards` table (2-page kanban
> MVP) are gone, superseded by `session_reviews` and `tasks` below, backed by
> [`firebase/FIREBASE_SCHEMA.md`](../firebase/FIREBASE_SCHEMA.md) (Firestore — the backend was
> originally built on Supabase/Postgres and migrated to Firebase/Firestore; see the
> [2026-07-25 entries](CONTRACT_CHANGES.md) in `CONTRACT_CHANGES.md`). Still missing from this
> file: contracts for `workspaces`, `workspace_members`, `sessions` (core fields), `documents`,
> `projects`, and `notifications` — the schema for these exists in `FIREBASE_SCHEMA.md`, but no
> frontend/API contract has been written for them yet.

> **This file is the single source of truth for the data shapes connecting Person A, Person
> B, and Person C's work.** Nobody changes a field name, type, or shape here without first
> logging the change in [`CONTRACT_CHANGES.md`](CONTRACT_CHANGES.md) and notifying the rest
> of the team. If your code and this file disagree, this file wins — fix the code.

## Contract 1 — Session Review object

One row per session, keyed by `session_id`. Backs the Session Review page's eight
AI-generated tabs (Documents and Transcript live elsewhere — see the stale note above).

```json
{
  "id": "doc-id-string",
  "session_id": "doc-id-string",
  "executive_summary": "The team aligned on shipping v2 by end of quarter...",
  "discussion_topics": [ /* array, shape owned by Person B's prompt design */ ],
  "decisions": [ /* array, shape owned by Person B's prompt design */ ],
  "tasks": [ /* array — AI's raw candidate tasks for this session, NOT Contract 2 objects */ ],
  "timeline": [ /* array, shape owned by Person B's prompt design */ ],
  "insights": [ /* array, shape owned by Person B's prompt design */ ],
  "risks": [ /* array, shape owned by Person B's prompt design */ ],
  "questions": [ /* array, shape owned by Person B's prompt design */ ],
  "created_at": "2026-07-25T00:00:00Z",
  "updated_at": "2026-07-25T00:00:00Z"
}
```

**Field rules:**
- `id`, `session_id` — Firestore document ID strings, not UUIDs. `id` and `session_id` are
  always equal — the `session_reviews` document ID *is* the session's ID (this is how the 1:1
  one-review-per-session relationship is enforced; see `FIREBASE_SCHEMA.md`).
- `executive_summary` — plain text, may be `null` before generation has run.
- `discussion_topics`, `decisions`, `timeline`, `insights`, `risks`, `questions` — jsonb
  arrays, default `[]`. Person B owns the element shape for each and must document it here
  once the extraction prompt is finalized — do not invent a shape on the frontend.
- `tasks` — jsonb array of AI-extracted **candidates** shown in the Session Review "Tasks"
  tab. These are *not* Contract 2 task objects: they have no `id`/`status` workflow yet.
  Promoting one into a real, actionable task means creating a row in the `tasks` table
  (Contract 2), not editing this array in place.

## Contract 2 — Task object (workspace task board)

The persisted, actionable task — what the Tasks page, Projects, and Calendar all read from.
Distinct from `session_reviews.tasks` above (see that field's rule).

```json
{
  "id": "doc-id-string",
  "workspace_id": "doc-id-string",
  "project_id": "doc-id-string-or-null",
  "session_id": "doc-id-string-or-null",
  "title": "Fix login bug",
  "owner": "John",
  "deadline": "2026-07-25",
  "priority": "red",
  "status": "todo",
  "created_at": "2026-07-25T00:00:00Z",
  "updated_at": "2026-07-25T00:00:00Z"
}
```

**Field rules:**
- `id`, `workspace_id` — Firestore document ID strings, always present.
- `project_id`, `session_id` — Firestore document ID string or `null`. A task doesn't have to
  belong to a project or originate from a session.
- `title` — required. Note the field is `title`, not `task` (this changed from the old
  kanban MVP's Contract 1 — see `CONTRACT_CHANGES.md`).
- `owner` — defaults to `"Unassigned"` if not specified. Never `null`.
- `deadline` — an ISO date string (`YYYY-MM-DD`) or `null`. **Changed from the old
  contract:** the database stores `null` for "no deadline", not the literal string
  `"No deadline"`. The frontend/API layer is responsible for rendering a `null` deadline as
  "No deadline" — don't send or expect that string over the wire.
- `priority` — exactly one of `"red"`, `"amber"`, `"gray"`. **Changed from the old
  contract:** these used to be `"high"` / `"medium"` / `"low"`; the DB now stores the display
  color directly.
- `status` — exactly one of `"todo"`, `"in_progress"`, `"done"`. Note the underscore in
  `in_progress` (changed from the old contract's hyphen).

## Contract 3 — extractSessionReview API request/response

**Endpoint:** `POST https://<region>-<project-id>.cloudfunctions.net/extractSessionReview`
(local emulator: `POST http://localhost:5001/<project-id>/<region>/extractSessionReview`)

**Request:**
```json
{ "session_id": "doc-id-string", "transcript": "raw transcript text, as a single string" }
```

**Success (200):**
```json
{ "session_review": { /* Contract 1 object */ } }
```

**Error (4xx/5xx):**
```json
{ "error": "human-readable message safe to show the user" }
```

The response must never return both `session_review` and `error` at once, and never neither.
Requires an `Authorization: Bearer <Firebase ID token>` header — the endpoint verifies the
token with the Firebase Admin SDK, then checks the caller's access to `session_id` via the
same workspace-membership check as Firestore's Security Rules (see
`firebase/FIREBASE_SCHEMA.md` and `firebase/functions/src/extractSessionReview.ts`), so a 404
means either the session doesn't exist or the caller isn't a member of its workspace.
