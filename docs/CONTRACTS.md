# Contracts

> ⚠️ **STALE:** These contracts describe the old 2-page kanban MVP (a single Task object).
> Person A's doc now targets the full Recall workspace app (Sessions, Projects, Tasks,
> Calendar, a 10-section Session Review). Person B and Person C need to rewrite this file to
> match — see the [2026-07-25 entry](CONTRACT_CHANGES.md) in `CONTRACT_CHANGES.md`.

> **This file is the single source of truth for the data shapes connecting Person A, Person
> B, and Person C's work.** Nobody changes a field name, type, or shape here without first
> logging the change in [`CONTRACT_CHANGES.md`](CONTRACT_CHANGES.md) and notifying the rest
> of the team. If your code and this file disagree, this file wins — fix the code.

## Contract 1 — Task object

```json
{
  "id": "uuid-string",
  "task": "Fix login bug",
  "owner": "John",
  "deadline": "2026-07-25",
  "priority": "high",
  "status": "todo"
}
```

**Field rules:**
- `id` — a generated UUID.
- `owner` — defaults to `"Unassigned"` if not mentioned in the notes. Never `null`.
- `deadline` — an ISO date string (`YYYY-MM-DD`) or the literal string `"No deadline"`.
  Never a raw free-text phrase (e.g. "next Friday"), never `null`.
- `priority` — exactly one of `"high"`, `"medium"`, `"low"`.
- `status` — exactly one of `"todo"`, `"in-progress"`, `"done"`. Always starts as `"todo"`
  when a task is first generated.

## Contract 2 — API request/response

**Endpoint:** `POST /functions/v1/extract-tasks`

**Request:**
```json
{ "notes": "raw pasted text or transcript, as a single string" }
```

**Success (200):**
```json
{ "tasks": [ /* array of Contract 1 objects */ ] }
```

**Error (4xx/5xx):**
```json
{ "error": "human-readable message safe to show the user" }
```

The response must never return both `tasks` and `error` at once, and never neither.

## Contract 3 — Database schema

Table `boards`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key, default `gen_random_uuid()` |
| `raw_text` | text | the original pasted notes/transcript |
| `tasks` | jsonb | array of Contract 1 objects |
| `created_at` | timestamp | default `now()` |
