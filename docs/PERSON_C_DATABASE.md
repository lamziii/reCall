# Person C — Database & Error Handling

> ⚠️ **STALE:** This doc only covers a single `boards` table for the 2-page kanban MVP.
> Person A's doc now targets the full Recall workspace app — schema is needed for Sessions,
> Projects, Tasks, and Calendar data, plus auth/workspace tables. This needs a rewrite — see
> the [2026-07-25 entry](CONTRACT_CHANGES.md) in `CONTRACT_CHANGES.md`.

## Responsibilities
Person C owns persistence and reliability: the Supabase schema, the functions that save and
load boards, and making sure failures anywhere in the app (AI extraction, saving, loading,
network issues) show the user something clear instead of a silent break or a raw error.

Core responsibilities:
- Create and own the Supabase database schema
- Build the save/load functions that Person A's frontend calls
- Define and help implement error states across the app for every realistic failure mode
- Prepare realistic sample demo data for the "Try a sample" button
- Keep the hackathon scope simple (no auth, public access) while leaving a clear note on
  what changes post-hackathon

## What you're building

**1. Supabase schema** matching Contract 3 in CONTRACTS.md exactly — don't add or rename
columns without updating that file first.

**2. Save/load helper functions** — saveBoard(rawText, tasks), loadBoard(id), and
updateBoardTasks(id, tasks) — that Person A's frontend imports and calls directly. Each
should catch Supabase errors and throw clear, user-facing messages rather than raw error
objects.

**3. Error states to design for** (work with Person A to make sure each has a real, visible
UI state, not just a console.log):
- Generating a board fails (AI/API error from Person B's endpoint)
- Saving a board fails (Supabase write error)
- Loading a board fails (bad/missing ID, e.g. someone bookmarks a broken link)
- Empty input submitted (no notes pasted, caught before even calling the API)
- Network offline / request timeout

**4. Sample demo data** — prepare 1–2 realistic "messy meeting notes" text blocks for the
"Try a sample" button, hand them to Person A, and verify they reliably produce a
good-looking board.

## Checklist
- [ ] boards table created in Supabase, matches Contract 3
- [ ] saveBoard, loadBoard, updateBoardTasks functions written and tested directly before
      handing off to Person A
- [ ] Error states defined and handed to Person A with clear messages for each case above
- [ ] Sample demo text prepared and verified to produce a good board
- [ ] Public read/write access is fine for the hackathon — auth is explicitly out of scope
