# Person A — Frontend / UI

## Responsibilities
Person A owns everything the user sees and interacts with directly: the input page, the
kanban board, styling, and animations. This role builds against the data contracts defined
in CONTRACTS.md, not against the real API or database directly — so work can start
immediately without waiting on Person B or Person C.

Core responsibilities:
- Build the input page where users paste notes and trigger board generation
- Build the kanban board page where extracted tasks appear as cards
- Implement drag-and-drop (or a simpler fallback) to move cards between columns
- Implement inline editing and deleting of cards
- Style and animate the app so the demo has a clear "wow" moment
- Handle loading and error states visibly, using the shapes Person C defines
- Connect to Person B's API and Person C's save/load functions once they're ready

## What you're building

**1. Input page (/)**
- Textarea for pasting notes
- "Generate Board" button
- "Try a sample" button — loads pre-written demo text (coordinate with Person C, who owns
  preparing sample data, or use a placeholder until it's ready)
- Loading state while waiting for the API response

**2. Board page (/board/:id)**
- Three columns: To Do / In Progress / Done
- Task cards showing task, owner, deadline, priority — use these exact field names from
  Contract 1 in CONTRACTS.md, don't rename them
- Drag-and-drop between columns (or a dropdown-to-move fallback if time is short — cut this
  first if behind schedule)
- Inline edit and delete on cards
- Color-code cards by priority (e.g. red/amber/gray)
- "New board" button back to /

## Before the API exists — build against fake data
Don't wait for Person B. Hardcode an array matching Contract 1 exactly and build/style the
entire board against it before the real endpoint exists.

## Checkpoint 1 — swap fake data for the real call
Once Person B's endpoint exists, call POST /functions/v1/extract-tasks with { notes }, and
handle both the { tasks: [...] } and { error: "..." } response shapes from Contract 2.

## Checkpoint 2 — connect to Person C's save/load
Once Person C's Supabase functions exist, save the board right after generation, and load it
by ID when the board page mounts, so a refresh doesn't lose the board.

## Checklist
- [ ] Input page UI built and styled
- [ ] Board page UI built against fake data
- [ ] Drag-and-drop or dropdown move working
- [ ] Inline edit/delete working
- [ ] Real API call wired in (post-Checkpoint 1)
- [ ] Save/load wired in (post-Checkpoint 2)
- [ ] Loading and error states visible and styled
- [ ] Responsive enough to demo on a laptop screen without breaking
