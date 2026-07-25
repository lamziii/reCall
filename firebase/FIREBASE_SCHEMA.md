# Firebase Schema

Recall's data model mapped to Firestore collections and documents. **This is the single source of truth for the database layer** — see [`docs/CONTRACTS.md`](../docs/CONTRACTS.md) for the frontend/API-facing field contracts these collections back.

## Collection Structure

### workspaces/{workspaceId}
One document per workspace. Owner auto-enrolled as a member via Cloud Function trigger.

```json
{
  "name": "Acme Corp",
  "owner_id": "auth-uid-string",
  "created_at": "2026-07-25T00:00:00Z",
  "updated_at": "2026-07-25T00:00:00Z"
}
```

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
- `status` — exactly one of `"live"` or `"completed"`.
- `ended_at`, `recording_url`, `transcript` — optional, populated when the session ends.

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

## Updated-at Timestamps

All collections with `updated_at` field are updated via Cloud Function triggers (`onUpdate`) that automatically refresh the timestamp when the document changes.
