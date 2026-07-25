# Project Plan — reCall

## The idea

reCall turns messy meeting notes or transcripts into an AI-organized kanban action board. A
user pastes their notes, an AI extraction step reads through them and pulls out each action
item as a structured task — with a task description, owner, deadline, and priority — and a
kanban board appears with those tasks as cards in seconds.

**Stack:**
- Frontend: React (Vite) + Tailwind
- API/AI: Supabase Edge Function calling the Claude API (Haiku 4.5) for extraction
- Database: Supabase Postgres

## MVP scope — two pages, nothing else

For the hackathon, the entire product is two pages:

1. **Input page (`/`)** — paste notes, hit "Generate Board", optionally load a sample.
2. **Board page (`/board/:id`)** — the generated kanban board: three columns, task cards,
   drag/drop or move, inline edit/delete.

Nothing else is in scope during the hackathon: no auth, no multi-user boards, no board list
page, no settings, no history. If it's not one of these two pages, it doesn't exist yet.

**Explicitly out of scope:** live meeting-link auto-transcription (auto-joining a Zoom/Meet
call and transcribing it live) is **not** part of the hackathon build. Only pasted text is
supported as input for the MVP, with uploaded-audio-file transcription (via Whisper) as an
optional stretch goal for Person B. Live meeting integration is a roadmap item, not a
hackathon deliverable.

## Roles

- **Person A — Frontend / UI**: everything the user sees and interacts with. See
  [`PERSON_A_FRONTEND.md`](PERSON_A_FRONTEND.md).
- **Person B — API / AI calling**: the Edge Function that turns raw notes into structured
  tasks via Claude. See [`PERSON_B_API.md`](PERSON_B_API.md).
- **Person C — Database & error handling**: schema, persistence, and making every failure
  mode visible instead of silent. See [`PERSON_C_DATABASE.md`](PERSON_C_DATABASE.md).

All three roles build against [`CONTRACTS.md`](CONTRACTS.md) so work can start in parallel
without anyone blocking anyone else.

## Hour-by-hour timeline (8 hours)

| Time | Focus |
|---|---|
| **0:00 – 0:30** | Kickoff. Walk through `CONTRACTS.md` together as a team, confirm everyone agrees on the shapes before writing code. Set up repos, Supabase project, Claude API key. |
| **0:30 – 2:00** | Parallel build. Person A builds the input + board pages against hardcoded fake data matching Contract 1. Person B scaffolds the Edge Function and writes the first version of the extraction prompt. Person C creates the `boards` table and stubs out the save/load functions. |
| **2:00 – 2:30** | **Checkpoint 1 — API integration.** Person B's `extract-tasks` endpoint is live. Person A swaps the fake array for a real `fetch` call and confirms real notes produce a real board end to end. |
| **2:30 – 4:30** | Continue building. Person A adds drag-and-drop (or dropdown fallback), inline edit/delete, priority color-coding. Person B hardens defensive JSON parsing and error handling for every failure mode. Person C finishes `saveBoard` / `loadBoard` / `updateBoardTasks` and prepares sample demo notes. |
| **4:30 – 5:00** | **Checkpoint 2 — persistence integration.** Person A wires in Person C's save/load functions: a board saves right after generation and reloads correctly from its URL, so a refresh doesn't lose it. |
| **5:00 – 6:30** | Polish. Styling and animation pass for the "wow" moment, loading/error states wired and visibly styled for every case Person C defined, sample demo data verified to produce a good-looking board. |
| **6:30 – 7:30** | Bug bash. Full run-throughs of the golden path and edge cases (empty input, API failure, bad board ID, offline). Fix what breaks. Cut scope (e.g. drag-and-drop → dropdown) if something is at risk. |
| **7:30 – 8:00** | Demo rehearsal and buffer. Confirm the sample-data path works reliably as a fallback if live extraction is flaky on stage. |

## Challenges to watch for

- **Contract drift.** Someone changes a field name or response shape without updating
  `CONTRACTS.md` and telling the team — this breaks integration silently and is the single
  biggest risk to the two checkpoints landing on time. Any contract change must go through
  `CONTRACT_CHANGES.md`.
- **Unreliable AI output formatting.** Claude may wrap JSON in prose or code fences despite
  instructions. Person B's defensive parsing (strip everything outside the first `[`/last
  `]`) and field defaulting are not optional polish — they're required for the demo to be
  reliable.
- **CORS / auth friction calling the Edge Function from local dev.** Verify this early at
  Checkpoint 1, not right before the demo.
- **Over-investing in drag-and-drop.** It's a "wow" feature, not core functionality. Time-box
  it and fall back to a dropdown-to-move control if it's eating the schedule.
- **Demo-day flakiness.** Live API calls can fail on stage from network issues or rate
  limits. Keep the verified sample-data path ready as a fallback so the demo doesn't depend
  on a live model call succeeding in front of an audience.
- **Scope creep.** Auth, multi-user boards, live meeting transcription, and anything not on
  the two-page MVP list must be explicitly deferred, no matter how tempting mid-hackathon.
