# Recall — Full Project Recap (2026-08-13)

> **Purpose of this file.** A complete, current, hand-off-ready snapshot of the whole project so
> another AI (or engineer) can plan the next steps. It describes *what actually exists in the code
> today*, how each piece is built, and what problem it solves. It supersedes `PROJECT_STATUS.md`
> (audited 2026-08-04) where they disagree — several things marked "not done" there have since
> shipped (real diarization, a full AI assistant, usage/billing, editable settings). Code wins over
> older docs.
>
> Verified against the repo on 2026-08-13, main branch, after PR #8 (settings redesign +
> transcription config). There are uncommitted homepage tweaks in the working tree.

---

## 1. What Recall is

**Recall turns a recorded or pasted conversation into a structured, trackable workspace.**

You record a meeting (or import/paste a transcript). A server-side AI step produces a **Session
Review** — executive summary, discussion topics, decisions, candidate tasks, a timeline, insights,
risks, and open questions. Extracted tasks automatically become real, trackable board tasks. On top
of that sits a team workspace (home dashboard, sessions, tasks, calendar, projects, people, teams,
reviews, notifications, usage/billing, settings) and **Recall AI**, an assistant that answers
questions grounded in your workspace content.

- **Problem it solves:** the "what did we actually decide, and who owns what?" gap after every
  meeting — and the follow-on gap of *retrieving* that knowledge later.
- **Origin:** built by a 3-person team in an ~8h hackathon as a 2-page kanban MVP (paste notes → AI
  extracts tasks → board). Backend was originally Supabase/Postgres, **migrated to Firebase**. Now
  being hardened toward production by two developers (Uvejs & Lorik).

---

## 2. Tech stack

**Frontend** (`frontend/`)
- React 19 + TypeScript, Vite 8, Tailwind CSS v4
- react-router-dom v7, framer-motion, lucide-react, class-variance-authority
- Firebase Web SDK v12 (auth, firestore, storage, functions) — wired and live
- Vitest + Testing Library, tests co-located with components/data
- Path alias `@/` → `frontend/src`

**Backend** (`firebase/functions/`, TypeScript, Node 20)
- Firestore (DB), Cloud Functions (HTTPS + Firestore triggers), Cloud Storage (audio), Firebase Auth
- Security Rules (`firestore.rules`), composite indexes (`firestore.indexes.json`), storage rules

**AI / transcription (all server-side — no keys in the client)**
- **Claude** (Anthropic SDK, Structured Outputs) generates the Session Review and powers Recall AI.
  Model via `ANTHROPIC_MODEL`.
- **OpenAI `gpt-4o-transcribe-diarize`** is the default transcription provider — **now with real
  speaker diarization**. A **Speechmatics** diarizing provider exists behind the same seam.
- A pluggable transcription-provider layer (`functions/src/transcription/`): registry, provider
  interface, long-recording chunker/merger, audio validation, language metrics, an Albanian
  vocabulary aid, and a Claude-based code-switching **correction pass**.

**Legacy (dead, still in repo):** `api/`, `database/` (pointer READMEs), `supabase/` (pre-migration
Edge Function). Safe to delete.

---

## 3. The core vertical slice (fully live, end to end)

This is the spine of the product and the most finished flow:

```
sign in → onboarding → Start Session → record audio OR paste transcript
  → session doc created in Firestore, audio uploaded to Storage (best-effort)
  → transcribeSession (OpenAI diarize, chunked for long files)
  → correctTranscript (Claude code-switch fixup, high-confidence only)
  → extractSessionReview (Claude Structured Outputs) writes session_reviews/{sessionId}
  → sessionArtifacts canonicalizes candidate tasks into real tasks/{id}
  → Session Review UI updates in realtime via onSnapshot
  → tasks appear on Tasks board / Home / Calendar automatically
```

**How it's wired**
- `pages/app/record-live.tsx` (live) captures audio via `MediaRecorder` + AnalyserNode visualizer +
  timer, with a Web Speech live transcript; or accepts a pasted/imported transcript. Creates a
  `sessions/{id}` doc; uploads `.webm` to Storage (non-blocking).
- `lib/firebase/functions.ts` is the client for the Cloud Functions (`requestTranscription`,
  `requestSessionReview`, voice, etc.), always attaching the Firebase ID token.
- Server functions verify the ID token + workspace membership before doing anything.
- The review UI (`session-review-live.tsx`) subscribes to `session_reviews/{sessionId}` and renders
  `processing` / `failed` / ready states honestly (no silent fallback to fake data).

**Problem each stage solves:** capture the meeting → get accurate multilingual text with speakers →
turn text into decisions/tasks → make those decisions *usable and trackable* across the app.

---

## 4. Feature-by-feature status

### Customer-facing pages (in the `/app` sidebar)

| Page | Route | Status | What it does / how it's built |
|---|---|---|---|
| Home dashboard | `/app` | ✅ Live | Aggregates live sessions + tasks into view models (`data/home/*`, `dashboard-mappers.ts`). Respects the user's "default landing page" preference via `LandingGate`. |
| Recall AI | `/app/assistant` | ✅ Live | Workspace assistant. SSE streaming chat grounded in workspace context; usage-limited, with history + pinning. See §5. |
| Sessions | `/app/sessions` | ✅ Live | Realtime session list (`use-sessions-list-data.ts`). |
| Session Review | `/app/sessions/:id` | ✅ Live | Overview/Decisions/Transcript/Tasks tabs; audio playback, Speaker N → name mapping + "Save & re-analyze", promote candidate → board task (idempotent, deterministic id). |
| Record / New Session | `/app/record` | ✅ Live (paste+transcribe) / 🚧 audio-record UI is demo-mode only | Two diverged UIs: `record-live.tsx` (live) and `record.tsx` (demo audio experience). |
| Projects | `/app/projects`, `/:id` | ❌ Not wired | Pages read the **localStorage sample layer** (`projects-service.ts`). Firestore `projects` schema exists + a trigger exists, but the UI is not reading live. Empty in the real app. |
| Tasks | `/app/tasks` | ✅ Live | Realtime board; inline status writes back via snapshot. Auto-populated by `sessionArtifacts`. |
| Calendar | `/app/calendar` | ✅ Live | Live sessions + dated tasks on a month grid; **meeting scheduling + reminders** and **7-day free-trial** surfacing added (`data/calendar/*`). Demo branch still reads the sample layer. |
| Usage | `/app/usage` | ✅ Live | Replaced Search in the sidebar. Shows monthly minutes used vs plan cap, Recall-AI questions used vs cap, bonus minutes/questions, and the free-trial countdown. Reads live workspace + sessions. |
| People | `/app/people`, `/:id` | ❌ Not wired | **No backend collection.** Frontend concept + sample data only. |
| Teams | `/app/teams`, `/:id` | ❌ Not wired | **No backend collection.** Sample data only. |
| Reviews | `/app/reviews` | ❌ Not wired | Reads sample layer; not connected to live `session_reviews`. |
| Notifications | `/app/notifications` | ❌ Not wired | Firestore `notifications` schema exists; page reads the sample layer. Menu in the sidebar. |
| Settings | `/app/settings/:section` | ✅ Live (big upgrade) | Sectioned shell, mostly editable now. See §6. |

### Pre-auth / public

| Page | Route | Status | Notes |
|---|---|---|---|
| Marketing home | `/` | ✅ Complete | Built-out landing page with animated demo sections (hero, extraction, pipeline, knowledge graph, search, security, value, FAQ, CTA). Forced dark. Uses a reusable demo engine (`pages/home/demos/use-demo-timeline.ts` + `demo-frame.tsx`). Hero currently reverted to a static screenshot (uncommitted). |
| Plans | `/plans` | ✅ Complete | Public pricing page. Pro vs Teams, usage packs, AI-question packs, 7-day trial messaging. Reads `data/plans.ts`. Forced dark. |
| Login / Sign up | `/login` | ✅ Complete | Real Firebase Auth: Google (popup → redirect fallback) + email/password. `RedirectIfAuthed`. |
| Onboarding | `/onboarding` | ✅ Live | 7-step funnel: create account, secure account (email verify + real TOTP 2FA w/ honest "pending config" fallback), use cases, workspace, regional prefs (4 languages incl. Albanian, tz auto-detect, country list, date/time formats), invite team, review. Creates real account + `ws-<uid>` workspace, enrolls owner, persists per step, resumes after refresh. Invite email delivery is an unfinished seam. |

### Internal / dev-only

| Surface | Route | Notes |
|---|---|---|
| Design system | `/dev/design` | Component/token showcase (~150 components). Not a product page. |
| Transcription benchmark | `/dev/transcription-benchmark` | Auth-gated internal tool comparing provider accuracy/latency (`benchmarkTranscription` fn + `language-metrics`). |
| Dev task board | `/tasks` | Uvejs/Lorik shared backlog in `development_tasks` (atomic reserve/take-over, idempotent seed). Auth-gated, not in the customer sidebar. Distinct from `/app/tasks`. See `DEVELOPMENT_TASKBOARD.md`. |

---

## 5. Recall AI (the assistant) — new since last audit

**What it does:** an in-app assistant (`/app/assistant`, plus a `/ai` command palette + panel) that
answers questions grounded strictly in the user's workspace content — meetings, decisions, tasks,
projects, people. History + pinning; usage-limited per plan.

**How it's built**
- Client: `lib/ai/recall-ai-client.ts` streams answers over **SSE** from the `recallAiChat` function,
  attaching only the Firebase ID token (Anthropic key never leaves the server). `recall-ai-provider.tsx`
  holds panel state; `use-voice-input.ts` records a snippet and calls `transcribeVoice` to dictate
  into the composer.
- Server: `functions/src/recallAiChat.ts` verifies token + workspace membership, retrieves a bounded
  context package (`ai/context-retrieval.ts`: recent sessions + open tasks + projects + the focused
  entity, always scoped to `workspace_id`), builds a hardened system prompt
  (`ai/system-prompt.ts`: workspace content is delivered inside a `<workspace_context>` block and
  treated as untrusted data — **prompt-injection defense**), streams Claude's reply, and increments
  monthly usage.
- **Usage/limits:** counted in `workspaces/{id}.ai_usage["YYYY-MM"]`; caps come from the plan
  (`data/plans.ts`, mirrored server-side because functions can't import frontend files); bonus
  questions via `bonus_ai_questions`. Client reflects this through `use-ai-usage.ts`.

**Problem it solves:** the second half of the value prop — not just capturing knowledge but
*retrieving and acting on it* conversationally, without leaking one workspace's data into another.

---

## 6. Settings & preferences — big upgrade since last audit

The old audit said Settings was "essentially read-only (only theme editable)." **That is outdated.**

- **Sectioned shell** (`pages/app/settings.tsx` + `components/settings/**`) with child routes
  (`/app/settings/:section`) so tab switches are instant. Groups:
  - **Account:** Account (real name/email/avatar), Plan, Payments, Notifications.
  - **Customization:** Appearance, Workspace, Productivity, AI, Accessibility, Personalization,
    Experimental, Advanced.
- **Preferences engine** (`frontend/src/settings/**`): a large typed preference schema (accent,
  font, density, radius, shadow, line-height, text size, dashboard layout, landing page, greeting,
  summary/citation/AI-response style, task detection, quick actions, timestamp precision, transcript
  width, language, date/time formats, and more). Every option set is an `as const` array;
  `sanitizePreferences` rebuilds a valid object from arbitrary input (never throws) — powers loading,
  migration, and import validation.
- **Persistence:** localStorage (instant startup cache) **+** cloud sync via a `preferences` field on
  the existing `users/{uid}` doc (not a second DB), migration-safe through `migratePreferences`.
- Applied at runtime via `apply-preferences.ts` / `runtime.ts` (CSS variables etc.).

**Still missing:** editable workspace members, billing actions that actually charge, and some
sections are display-only shells (Payments).

---

## 7. Backend — Cloud Functions

Exported from `functions/src/index.ts`:

| Function | Type | Purpose |
|---|---|---|
| `extractSessionReview` | HTTPS | Auth + membership check → build speaker-labeled transcript → Claude Structured Outputs → write `session_reviews/{sessionId}`. |
| `transcribeSession` | HTTPS | OpenAI `gpt-4o-transcribe-diarize` with **long-recording chunking** (splits audio under the ~25MB / ~20min request cap, bounded concurrency, retries w/ backoff — `transcription/config.ts`), then runs `correctTranscript`. Writes `{ transcript, segments, speakers, diarized }`. Falls back to the browser transcript. |
| `transcribeVoice` | HTTPS | Single-speaker voice → text for the Recall AI composer. Writes nothing; just returns `{ text }`. |
| `recallAiChat` | HTTPS (SSE) | The assistant. See §5. |
| `benchmarkTranscription` | HTTPS | Internal provider comparison tool. |
| `correctTranscript` | lib | Claude code-switching correction pass (Albanian↔English etc.) run between diarization and analysis. High-confidence only; any failure keeps the raw transcript, so it can only improve results. `TRANSCRIPT_CORRECTION=off` disables. |
| `sessionArtifacts` | lib | **Canonicalizes** review candidates into real `tasks/{id}` docs automatically on analysis completion, with stable deterministic ids (re-analysis updates in place, never duplicates, never clobbers user status). This is why Tasks/Home/Calendar populate without a manual "Add to Tasks" click. |
| triggers | Firestore | `onWorkspaceCreated` (owner auto-enroll), `updated_at` stampers for workspaces/sessions/reviews/projects/tasks. |
| `onInviteCreated` | Firestore | Fires on `workspace_invites` (email delivery not yet configured). |

`aiEnvironment.ts` centralizes AI key/model config; `admin.ts` is the shared Firestore handle.

---

## 8. Data model (Firestore)

Source of truth: `firebase/FIREBASE_SCHEMA.md`; field contracts in `docs/CONTRACTS.md`.

**Real collections**
- `workspaces/{id}` + `members/{userId}` subcollection — multi-tenancy; owner auto-enrolled. Now also
  carries `plan`, `ai_usage["YYYY-MM"]`, `bonus_ai_questions`, bonus minutes, `created_at` (trial anchor).
- `sessions/{id}` — recording metadata, transcript, segments/speakers, `review_status`, participants.
- `session_reviews/{sessionId}` — AI output; **doc id == session id** (1:1). Holds
  `executive_summary`, `discussion_topics`, `decisions`, **candidate** `tasks`, `timeline`,
  `insights`, `risks`, `questions`.
- `tasks/{id}` — the actionable board task. `priority ∈ red|amber|gray`, `status ∈
  todo|in_progress|done`, `deadline` ISO or `null`, `owner` default `"Unassigned"`. Carries
  `source_review_id` / `source_candidate_index` when promoted (deterministic id = idempotent).
- `projects/{id}` — schema + trigger exist; **UI not reading live**.
- `notifications/{id}` — schema exists; **UI not reading live**.
- `documents/{id}` — schema + storage paths + rules exist; **no UI at all**.
- `workspace_invites/{id}` — persisted, secured; email delivery unconfigured.
- `development_tasks/{id}` — internal dev board (separate concern).
- `users/{uid}` — profile + onboarding progress + `preferences` (settings cloud sync).

**Two easily-confused task shapes:** `session_reviews.tasks` are raw AI **candidates** (no workflow);
the `tasks` collection is the persisted, trackable board task. Promotion = creating a `tasks` row.

**Frontend-only (no backend):** `people`, `teams` — TS types + sample data only.

---

## 9. What's complete vs partial vs not done

### ✅ Complete & live
Auth, onboarding, workspace bootstrap, the record→transcribe→diarize→correct→review→tasks slice,
Session Review page, Tasks board, Home, Sessions, Calendar, Usage, Recall AI assistant, Settings
(sectioned + preferences engine + cloud sync), marketing home, Plans page, real diarization,
long-recording pipeline, transcript correction, design system (~150 components).

### 🚧 Partial
- **Record UIs diverged** — `record.tsx` (demo audio) vs `record-live.tsx` (live). Should be unified.
- **Settings** — most sections editable, but Payments is a display shell; no editable workspace members.
- **Onboarding invites** — persisted, but no invite email delivery and no invite-acceptance page.
- **Billing** — plans, usage caps, and enforcement exist; **no real payment processing** (packs don't charge).

### ❌ Not wired to live (render empty in the real app)
Projects, Reviews, Notifications (schemas exist for the first + third) — all still read the
localStorage sample layer. People, Teams — **no backend at all**. Global Search exists as an index
(`use-search-index.ts`) + `/ai` palette, but there is no dedicated Search results page (Search was
replaced by Usage in the sidebar).

### ❌ Not started
Documents feature (schema/storage/rules ready, no UI), notification delivery (email/push), external
calendar sync (in-app calendar is internal only), real billing/payments.

---

## 10. What to remove / tech debt

- **Legacy dirs:** `api/`, `database/`, `supabase/` — dead, superseded by `firebase/`. Delete.
- **Dual data layer:** `workspace-repository.ts` (localStorage) + per-feature `*-service.ts` for
  projects/people/teams/reviews/notifications/calendar-demo still back the un-wired pages. Root cause
  of "half the app is empty." Finish the migration to live Firestore reads, then retire this layer.
- **Orphaned sample generator:** `data/sample/generate-sample-workspace.ts` only runs in tests /
  demo mode. Decide: keep strictly for tests, or wire an explicit demo mode.
- **Committed build artifacts:** `firebase/functions/lib/**` and `firebase/firebase-debug.log` are
  checked in. Gitignore + remove.
- **Overlapping components:** command-menu vs command-palette; search-overlay vs search-shell;
  `empty-route-page.tsx` used by a single route.
- **Stale docs:** `PROJECT_PLAN.md`, `PERSON_A/B/C_*.md`, `RECALL_CONTEXT.md` describe the hackathon
  MVP / Supabase era — historical only. `PROJECT_STATUS.md` is mostly right but predates diarization,
  the AI assistant, usage/billing, and the settings redesign — this file is newer.

---

## 11. Suggested priorities for the next planning pass

1. **Finish localStorage → Firestore migration** for Projects, Reviews, Notifications (schemas exist);
   then decide People/Teams — design a backend or cut them.
2. **Unify the two Record UIs** into one live audio-record experience.
3. **Ship invite email delivery + an invite-acceptance page** (the onboarding seam).
4. **Real billing** — connect a payment provider so usage/AI packs actually charge; wire the Payments
   settings section.
5. **Documents** — build the upload UI + Session Review tab on top of the existing schema/storage.
6. **A real global Search page** on top of the existing search index.
7. **Notification delivery** (email/push) for the `notifications` collection.
8. **Delete dead code** — legacy dirs, committed build artifacts.

---

### Open questions for the planners
- Are People/Teams staying as first-class concepts (need a backend) or folding into workspace members?
- Is billing real (Stripe etc.) for launch, or do plans stay honor-system with server-side caps only?
- Which diarization provider is canonical for production — OpenAI `gpt-4o-transcribe-diarize` or
  Speechmatics — and what's the language matrix beyond English/Albanian?
- Demo mode: keep `VITE_RECALL_DEMO` + the sample layer as a real product surface, or move it entirely
  under tests?
