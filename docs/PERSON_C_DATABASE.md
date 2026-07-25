# Person C — Database & Error Handling

> ℹ️ **Superseded below:** the single-`boards`-table plan described in this doc (checklist
> included) was for the old 2-page kanban MVP. The real schema — `workspaces`,
> `workspace_members`, `sessions`, `session_reviews`, `documents`, `projects`, `tasks`,
> `notifications`, Security Rules, Cloud Storage, and Firestore's built-in realtime listeners —
> is implemented on **Firebase/Firestore** in
> [`firebase/FIREBASE_SCHEMA.md`](../firebase/FIREBASE_SCHEMA.md), and the
> `extractSessionReview` Cloud Function is in
> [`firebase/functions/src/extractSessionReview.ts`](../firebase/functions/src/extractSessionReview.ts).
> (The backend was originally built on Supabase/Postgres and migrated to Firebase — see the
> [2026-07-25 entries](CONTRACT_CHANGES.md) in `CONTRACT_CHANGES.md`; the old `supabase/`
> directory is stale.) Field contracts are documented in [`CONTRACTS.md`](CONTRACTS.md). The
> checklist below still reflects the old MVP scope and needs a rewrite to match.

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
