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
