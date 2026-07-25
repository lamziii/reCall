# Contract Changes

A running log of every change made to [`CONTRACTS.md`](CONTRACTS.md) after the initial
version. `CONTRACTS.md` is the source of truth for the data shapes shared by all three
roles — if you need to change a field name, type, or shape defined there, do it here first.

## How to log a change

Before changing `CONTRACTS.md`, add an entry below with:

1. **What changed** — the exact field/shape that was added, removed, or modified.
2. **Why** — the reason the existing contract didn't work.
3. **Who needs to update their code** — which role(s)' code now needs to change to match.

Then update `CONTRACTS.md` itself, and tell the team directly (don't rely on someone
reading this file unprompted).

## Log

### 2026-07-25 — Product scope expanded from kanban MVP to full Recall workspace app
**What changed:** `docs/PERSON_A_FRONTEND.md` was replaced with a much larger spec: instead
of a 2-page (input + board) kanban tool, Recall is now a multi-page workspace app (Welcome,
Sign In, Create Workspace, Home, Sessions, Session Review, Live Recording, Projects, Project
Details, Tasks, Calendar, Search, Notifications, Settings), centered on a Session Review page
with ten sections (Executive Summary, Discussion Topics, Decisions, Tasks, Timeline,
Insights, Risks, Questions, Documents, Transcript).

**Why:** Person A's role doc was updated to this new spec; not otherwise recorded here.

**Who needs to update their code:** `docs/CONTRACTS.md` (Contract 1's Task-object-only shape
no longer covers a Session with ten sections), `docs/PERSON_B_API.md` (the single
`extract-tasks` endpoint doesn't cover generating a full Session Review — Executive Summary,
Decisions, Timeline, Insights, Risks, Questions, etc.), and `docs/PERSON_C_DATABASE.md` (the
single `boards` table doesn't cover Sessions, Projects, Tasks, or Calendar data) are all now
stale relative to this new scope and need to be rewritten by Person B and Person C to match.
`docs/PROJECT_PLAN.md`'s two-page MVP scope and 8-hour timeline no longer reflect the size of
this product either, and should be revisited by the team.

### 2026-07-25 — Person C: Supabase backend implemented (auth, schema, RLS, storage, realtime, extract-session-review)
**What changed:** Replaced the old `boards` table / `extract-tasks` endpoint with the full
Recall backend: `workspaces` + `workspace_members` (multi-tenancy), `sessions`,
`session_reviews`, `documents`, `projects`, `tasks`, `notifications` — all with RLS scoped to
workspace membership, `owner`-only delete on `workspaces`/`workspace_members`, private
`recordings` and `documents` storage buckets path-scoped by `workspace_id`, and Realtime
enabled on `sessions`, `tasks`, `notifications`. Implementation:
`supabase/migrations/20260725000000_recall_schema.sql`. Also added the
`extract-session-review` Edge Function (`supabase/functions/extract-session-review/`), which
handles the request/response contract and DB write but calls out to a stubbed
`generateSessionReview.ts` for the actual AI call.

Two intentional deviations from a literal reading of Person A's/the original request's field
list, both documented in `CONTRACTS.md`:
- `tasks.deadline` is a nullable `date` column (`null` = no deadline), not a text field that
  can hold the literal string `"No deadline"` — the API/frontend layer renders that string,
  the DB doesn't store it.
- `tasks.priority` stores `"red"`/`"amber"`/`"gray"` directly (the display color), not
  `"high"`/`"medium"`/`"low"` — matches the color-coding the frontend doc calls for without
  a translation step.
- `tasks.title` (not `tasks.task`) — matches the new schema request's column name; the old
  kanban Contract 1 used `task`.

**Why:** Requested directly — see `supabase-setup-prompt.md`.

**Who needs to update their code:**
- **Person B** — implement the real `generateSessionReview()` in
  `supabase/functions/extract-session-review/generateSessionReview.ts` (Claude Haiku 4.5,
  defensive parsing per `PERSON_B_API.md`), keeping the return shape (the eight
  `session_reviews` fields) identical to the stub. `docs/PERSON_B_API.md` itself still
  describes the old `extract-tasks` endpoint and needs a rewrite to describe this one.
- **Person A** — `session_reviews.tasks` (AI candidates shown in the Session Review "Tasks"
  tab) is a different shape from the `tasks` table (the real task board) — see the Contract 1
  field rule in `CONTRACTS.md`. Auth/workspace flows (Sign In, Create Workspace) now have
  real tables to build against (`workspaces`, `workspace_members`) rather than being
  frontend-only.
- **Still open, not covered by this change:** `CONTRACTS.md` entries for `workspaces`,
  `workspace_members`, `sessions` (core fields), `documents`, `projects`, and
  `notifications` — schema exists in the migration, no field contract written yet.

### 2026-07-25 — Backend migrated from Supabase/Postgres to Firebase/Firestore
**What changed:** The entire backend was rebuilt on Firebase, replacing
`supabase/migrations/20260725000000_recall_schema.sql` and `supabase/functions/` wholesale.
New implementation lives in `firebase/`:
- `firebase/FIREBASE_SCHEMA.md` — Firestore collection structure (source of truth for the DB
  layer, replaces the SQL migration).
- `firebase/firestore.rules` — Security Rules, replacing Postgres RLS policies. Same
  membership logic (`isWorkspaceMember` / `isWorkspaceOwner` helpers mirror the old
  `is_workspace_member()` / `is_workspace_owner()` SQL functions).
- `firebase/storage.rules` — Cloud Storage access control, replacing the `storage.objects` RLS
  policies on the `recordings`/`documents` buckets. Path convention changed from
  `<bucket>/<workspace_id>/...` to `workspaces/<workspace_id>/<recordings|documents>/...`
  (single bucket, path-prefixed, rather than two separate buckets).
- `firebase/functions/` — Cloud Functions, replacing the Supabase Edge Function and Postgres
  triggers:
  - `extractSessionReview` (HTTP function) replaces the `extract-session-review` Edge
    Function. Same request/response contract (Contract 3), but the endpoint URL shape changed
    (Cloud Functions URL, not `/functions/v1/...`) and auth is a Firebase ID token, not a
    Supabase session JWT.
  - `onWorkspaceCreated` replaces the `handle_new_workspace()` trigger (auto-enrolls a new
    workspace's creator as its owner member).
  - `onWorkspaceUpdated` / `onSessionUpdated` / `onSessionReviewUpdated` / `onProjectUpdated`
    / `onTaskUpdated` replace the shared `set_updated_at()` trigger — one Cloud Function per
    collection instead of one trigger reused across tables, since Firestore triggers are bound
    to a single collection path.

One structural change beyond a like-for-like port: **`session_reviews`' document ID is now the
session's ID** (`session_reviews/{sessionId}`), rather than a separate generated ID with a
`session_id` foreign-key column carrying a uniqueness constraint. Firestore has no
column-level `unique` constraint, so using the session ID as the document ID directly is the
idiomatic way to enforce "one review per session" — it also simplifies both the Security Rule
(no `get()` to look up `resource.data.session_id`, the path param doubles as it) and the
Cloud Function's upsert (`.doc(sessionId).set(...)` instead of query-then-write). The
`session_id` field is kept on the document too (redundant with the doc ID) so client code
reading query results doesn't need to special-case this.

**Why:** Requested directly — Firebase is easier for the team to understand/operate than
Supabase for this project.

**Who needs to update their code:**
- **Person B** — `generateSessionReview()` now lives at
  `firebase/functions/src/generateSessionReview.ts` (same stub, same shape, new path). The
  calling function moved from `supabase/functions/extract-session-review/index.ts` to
  `firebase/functions/src/extractSessionReview.ts`; the request/response contract (Contract 3)
  itself didn't change, only the transport (Cloud Functions HTTP trigger instead of Deno Edge
  Function) and the auth token type (Firebase ID token instead of Supabase JWT).
  `docs/PERSON_B_API.md` still describes the old `extract-tasks` endpoint from the pre-scope-
  expansion MVP and needs a rewrite regardless of this change.
- **Person A** — any frontend code written against `@supabase/supabase-js` needs to switch to
  the Firebase Web SDK (`firebase/app`, `firebase/firestore`, `firebase/auth`,
  `firebase/storage`). Field shapes in Contracts 1 and 2 are unchanged except that `id` fields
  are now Firestore document ID strings instead of UUIDs — this only matters if frontend code
  was validating the UUID format, which it shouldn't have been. See `firebase/README.md` for
  what config values are needed to connect (the Firebase web app config — not a secret, safe
  to put directly in frontend code).
- **Everyone:** the old `supabase/` directory and `docs/PERSON_C_DATABASE.md`'s references to
  it are stale as of this change — see `firebase/README.md` for the current setup
  instructions.
