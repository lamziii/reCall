# Firebase Schema

Recall's data model mapped to Firestore collections and documents. **This is the single source of truth for the database layer** — see [`docs/CONTRACTS.md`](../docs/CONTRACTS.md) for the frontend/API-facing field contracts these collections back.

## Collection Structure

### users/{uid}
Canonical per-account profile. **The document ID is the Firebase Auth uid.** A user can only read or
write their own profile (see `firestore.rules`). Created idempotently by `ensureWorkspace` and
enriched by onboarding (see [docs/ONBOARDING_ARCHITECTURE.md](../docs/ONBOARDING_ARCHITECTURE.md)).

```json
{
  "uid": "auth-uid-string",
  "display_name": "Ada Lovelace",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "email": "ada@acme.com",
  "photo_url": "https://…",
  "workspace_id": "ws-<uid>",
  "role": "owner",
  "auth_provider": "google | password",
  "onboarding_status": "not_started | in_progress | completed",
  "onboarding_step": 4,
  "onboarding_completed": false,
  "tutorial_completed": false,
  "preferred_language": "sq",
  "language_label": "Shqip",
  "country_code": "AL",
  "timezone": "Europe/Tirane",
  "date_format": "DD/MM/YYYY",
  "time_format": "12h | 24h",
  "use_cases": ["meeting-notes", "sales-calls"],
  "custom_use_case": null,
  "two_factor_status": "enabled | skipped | unavailable | null",
  "created_at": "2026-08-04T00:00:00Z",
  "updated_at": "2026-08-04T00:00:00Z"
}
```

**Field rules:**
- `preferred_language` — one of the four supported codes `sq | en | de | fr` (never a fifth).
- `two_factor_status` — `"unavailable"` means the user chose 2FA but the project hasn't enabled
  Identity Platform MFA (pending config); it is **not** a false "enabled". See
  [docs/AUTHENTICATION.md](../docs/AUTHENTICATION.md). Passwords are NEVER stored here.
- `onboarding_step` — 1-based resume pointer into the onboarding step list.

### workspaces/{workspaceId}
One document per workspace. The ID is deterministic (`ws-<owner-uid>`) so onboarding and the `/app`
fallback bootstrap never create competing documents. Owner auto-enrolled as a member via Cloud
Function trigger (and a client self-enroll rule).

```json
{
  "name": "Acme Corp",
  "owner_id": "auth-uid-string",
  "type": "startup",
  "team_size": "2-5",
  "industry": "software",
  "custom_industry": null,
  "onboarding_completed": true,
  "created_at": "2026-07-25T00:00:00Z",
  "updated_at": "2026-07-25T00:00:00Z"
}
```

**Field rules:**
- `type`, `team_size`, `industry`, `custom_industry`, `onboarding_completed` — set by onboarding
  (optional/null before then). `custom_industry` is only populated when `industry == "other"`.

**Indexes:**
- Composite: `owner_id` (Ascending), `created_at` (Descending)

### workspaces/{workspaceId}/members/{userId}
Subcollection. One document per workspace member. Automatically created for workspace creator (role: 'owner') by a Cloud Function trigger.

```json
{
  "role": "owner",
  "created_at": "2026-07-25T00:00:00Z"
}
```

**Field rules:**
- `role` — exactly one of `"owner"` or `"member"`. Owners can invite/remove members; members can only read workspace data.

### sessions/{sessionId}
Session recording metadata. Scoped to a workspace via `workspace_id`.

```json
{
  "workspace_id": "workspace-uuid",
  "title": "Q3 planning sync",
  "status": "live",
  "started_at": "2026-07-25T10:00:00Z",
  "ended_at": "2026-07-25T11:00:00Z",
  "recording_url": "gs://bucket/workspaces/{workspace_id}/recordings/{sessionId}.webm",
  "transcript": "raw transcript text...",
  "created_at": "2026-07-25T10:00:00Z",
  "updated_at": "2026-07-25T11:00:00Z"
}
```

**Field rules:**
- `workspace_id` — required, used for RLS scoping.
- `status` — one of `"scheduled"`, `"live"`, or `"completed"`. `"scheduled"` is a future meeting
  with no transcript yet, written by `scheduleSession()` (Calendar's "Schedule meeting" dialog).
- `ended_at`, `recording_url`, `transcript` — optional, populated when the session ends.

**Added fields (live vertical slice):**
- `review_status` — `"processing" | "completed" | "failed"`, optional. The AI review-generation
  state, distinct from the session-lifecycle `status`. Set by the `extractSessionReview` Cloud
  Function (processing on entry, completed/failed on exit) and read by the Session Review page's
  realtime listener to drive the processing / failed UI.
- `project_name` — string or null, optional. Denormalized project label captured at creation
  (the demo doesn't require a full `projects` join).
- `participants` — array of display-name strings, optional. Entered at session creation.
- `created_by` — auth uid of the creator, optional.
- `session_type` — string, optional (Meeting, Investor Conversation, Client Call, …).
- `notes` — string or null, optional. Free-text notes entered before recording.
- `segments` — array of `{ id, speakerId, speakerLabel, startMs, endMs, text, confidence? }`,
  optional. Raw transcript segments (browser Web Speech today; a diarizing provider later).
- `speakers` — array of `{ id, label, displayName: string|null, participantId?: string|null }`,
  optional. Speaker roster + label→name mapping. `recording_url` holds the Storage object path
  `workspaces/{workspace_id}/recordings/{sessionId}.webm`; `audio` holds `{ mimeType, durationSeconds }`.
  See ../docs/RECORDING_ARCHITECTURE.md.
- `scheduled_at` — timestamp, optional. Meeting start time for `status: "scheduled"` sessions —
  the Calendar and in-app reminders place the session by this instead of `created_at`.
- `meeting_link` — string or null, optional. Video/call link for a scheduled meeting.
- `reminder_minutes_before` — number or null, optional. Minutes before `scheduled_at` the client
  fires an in-app reminder toast (see frontend `data/calendar/use-meeting-reminders.ts`). Defaults
  to 10 when unset. Reminders are computed client-side while the app is open — there is no
  server-side/push delivery.

**Indexes:**
- Composite: `workspace_id` (Ascending), `status` (Ascending)
- Single: `workspace_id`
- Single: `status`

### session_reviews/{sessionId}
AI-generated insights for one session. **The document ID is the session's ID** — this is the
Firestore-native way to enforce the 1:1 relationship Supabase enforced with a `unique`
constraint on `session_id`, and it lets the `extract-session-review` Cloud Function upsert with
a plain `.set()` on a known path instead of a query-then-write. Created/updated by that
function.

```json
{
  "session_id": "session-uuid",
  "executive_summary": "The team aligned on shipping v2 by end of quarter...",
  "discussion_topics": [ /* array, shape owned by Person B */ ],
  "decisions": [ /* array, shape owned by Person B */ ],
  "tasks": [ /* array of AI-extracted candidate tasks, NOT task board objects */ ],
  "timeline": [ /* array, shape owned by Person B */ ],
  "insights": [ /* array, shape owned by Person B */ ],
  "risks": [ /* array, shape owned by Person B */ ],
  "questions": [ /* array, shape owned by Person B */ ],
  "created_at": "2026-07-25T11:00:00Z",
  "updated_at": "2026-07-25T11:00:00Z"
}
```

**Field rules:**
- `session_id` — redundant with the doc ID but kept as a field too, so client reads don't need
  to special-case "the doc ID is the foreign key" when working with query results.
- `executive_summary` — optional (null before generation).
- All `*_topics`, `decisions`, `timeline`, `insights`, `risks`, `questions` — jsonb arrays. Person B owns the element shape for each.
- `tasks` — jsonb array of AI-extracted **candidates** shown in Session Review "Tasks" tab. These are *not* `tasks` table objects — they have no id/status workflow yet.

No composite indexes needed — reads are always a direct `doc(sessionId)` lookup, not a query.

### documents/{documentId}
Metadata for files uploaded to a session. Actual files live in Cloud Storage at `gs://bucket/workspaces/{workspace_id}/documents/{documentId}/...`.

```json
{
  "session_id": "session-uuid",
  "workspace_id": "workspace-uuid",
  "name": "meeting-notes.pdf",
  "file_url": "gs://bucket/workspaces/{workspace_id}/documents/{documentId}/meeting-notes.pdf",
  "uploaded_at": "2026-07-25T11:00:00Z"
}
```

**Field rules:**
- `workspace_id` — required for RLS scoping (used in Security Rules to verify member access).

**Indexes:**
- Composite: `workspace_id` (Ascending), `session_id` (Ascending)
- Single: `workspace_id`
- Single: `session_id`

### projects/{projectId}
Project grouping for tasks. Scoped to a workspace via `workspace_id`.

```json
{
  "workspace_id": "workspace-uuid",
  "name": "Mobile v2",
  "description": "Redesign mobile app for iOS 18 SDK",
  "created_at": "2026-07-25T00:00:00Z",
  "updated_at": "2026-07-25T00:00:00Z"
}
```

**Indexes:**
- Single: `workspace_id`

### tasks/{taskId}
Actionable task on the workspace task board. Distinct from `session_reviews.tasks` (see Session Review's `tasks` field rule). Scoped to a workspace via `workspace_id`; optionally linked to a project or session.

```json
{
  "workspace_id": "workspace-uuid",
  "project_id": "project-uuid-or-null",
  "session_id": "session-uuid-or-null",
  "title": "Fix login bug",
  "owner": "John",
  "deadline": "2026-07-31",
  "priority": "red",
  "status": "todo",
  "created_at": "2026-07-25T00:00:00Z",
  "updated_at": "2026-07-25T00:00:00Z"
}
```

**Field rules:**
- `workspace_id` — required, used for RLS scoping.
- `project_id`, `session_id` — optional (null). A task doesn't have to belong to a project or originate from a session.
- `title` — required.
- `owner` — defaults to `"Unassigned"`. Never null.
- `deadline` — ISO date string (YYYY-MM-DD) or null. The frontend renders null as "No deadline".
- `priority` — exactly one of `"red"`, `"amber"`, `"gray"` (the display color).
- `status` — exactly one of `"todo"`, `"in_progress"`, `"done"`.

**Added fields (task promotion source linkage):** when a task is promoted from a Session
Review candidate, it also carries `source_review_id` (string or null — the `session_reviews`
doc id) and `source_candidate_index` (number or null — the candidate's index in
`session_reviews.tasks`). Promotion uses a deterministic task doc id (`<sessionId>-t<index>`)
so repeated promotions of the same candidate are idempotent (no duplicate board tasks).

**Indexes:**
- Composite: `workspace_id` (Ascending), `status` (Ascending)
- Composite: `workspace_id` (Ascending), `project_id` (Ascending)
- Composite: `workspace_id` (Ascending), `session_id` (Ascending)
- Single: `workspace_id`
- Single: `status`

### notifications/{notificationId}
Notification for a user within a workspace.

```json
{
  "workspace_id": "workspace-uuid",
  "user_id": "auth-uid",
  "type": "task_assigned",
  "payload": { "task_id": "...", "assigner": "..." },
  "read_at": null,
  "created_at": "2026-07-25T12:00:00Z"
}
```

**Indexes:**
- Composite: `workspace_id` (Ascending), `user_id` (Ascending)
- Composite: `user_id` (Ascending), `read_at` (Ascending)

### workspace_invites/{inviteId}
A pending invitation to join a workspace. The document ID is **deterministic**
(`<workspaceId>__<normalized-email>`, unsafe chars replaced) so re-inviting the same address is
idempotent (no duplicate invites). Created by the workspace owner during/after onboarding.

```json
{
  "workspace_id": "ws-<uid>",
  "email": "Teammate@Acme.com",
  "normalized_email": "teammate@acme.com",
  "role": "admin | member",
  "status": "pending | accepted | expired | revoked",
  "invited_by_user_id": "auth-uid",
  "invited_by_name": "Ada Lovelace",
  "created_at": "2026-08-04T00:00:00Z",
  "expires_at": "2026-08-18T00:00:00Z"
}
```

**Field rules & security** (`firestore.rules`):
- Only the workspace **owner** may create an invite; `role` is constrained to `admin | member`
  (never `owner`, preventing client self-escalation); `invited_by_user_id` must equal the caller;
  `status` must start `pending`.
- Read is limited to workspace members OR the invited email (`request.auth.token.email.lower() ==
  normalized_email`) so acceptance verifies the authenticated email.
- `workspace_id` and `role` are immutable on update.
- **Email delivery is not configured** — invites are persisted only. `onInviteCreated`
  (`functions/src/invites.ts`) is the send seam. See [docs/AUTHENTICATION.md](../docs/AUTHENTICATION.md).

**Indexes:**
- Composite: `workspace_id` (Ascending), `status` (Ascending)
- Composite: `normalized_email` (Ascending), `status` (Ascending)

## Cloud Storage Structure

### recordings bucket
Private bucket. Files stored at `gs://project-id.appspot.com/workspaces/{workspace_id}/recordings/{sessionId}.webm`, etc.

Security Rules enforce member access via the first path segment (workspace_id).

### documents bucket
Private bucket. Files stored at `gs://project-id.appspot.com/workspaces/{workspace_id}/documents/{documentId}/...`.

Security Rules enforce member access via the first path segment (workspace_id).

## Realtime Subscriptions

Firestore supports real-time listeners natively via `onSnapshot()`. The frontend can listen to:
- `sessions` collection (filtered by `workspace_id`) for live session updates
- `tasks` collection (filtered by `workspace_id`) for task board changes
- `notifications` collection (filtered by `user_id`) for personal notifications

## Auto-enrollment

When a new workspace is created, a Cloud Function trigger (`onCreate` on `workspaces/{workspaceId}`) automatically:
1. Creates a member document at `workspaces/{workspaceId}/members/{owner_id}` with `role: 'owner'`
2. Sets created_at to now

**Client-side owner self-enrollment (belt-and-suspenders).** `firestore.rules` also lets the
workspace's own owner create their own `owner` member doc (narrowly: only when
`request.auth.uid == userId`, the workspace's `owner_id` matches, and `role == 'owner'`). The
frontend `ensureWorkspace` (formerly `bootstrapWorkspace`, kept as a deprecated alias) writes this
membership itself so the first session write can't race the trigger; the trigger remains as a
redundant backstop. Workspace ids are derived deterministically from the owner uid (`ws-<uid>`), so
bootstrap is idempotent across refreshes — and onboarding writes to the same id, so the two paths
never create competing workspaces. See [docs/ONBOARDING_ARCHITECTURE.md](../docs/ONBOARDING_ARCHITECTURE.md).

## Updated-at Timestamps

All collections with `updated_at` field are updated via Cloud Function triggers (`onUpdate`) that automatically refresh the timestamp when the document changes.
