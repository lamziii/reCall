# Recall — Feature Audit (2026-08-29)

> Hands-on audit: every nav item was clicked through in a real logged-in session (Google OAuth,
> real Firestore workspace `mikullovciuvejs's Workspace`), with the local Cloud Functions emulator
> running so AI features (Recall AI, session review, transcription) could be exercised for real,
> not just read from source. Static-code checks (grep for `isLiveMode`, placeholder toasts, and the
> team's own internal dev-tasks backlog at `web/src/data/dev-tasks/seed-data.ts`) were used to
> cross-check what the UI showed. Supersedes the "known gaps" list embedded in that seed file where
> it's gone stale (dated 2026-08-15; several items have since shipped).

**Legend:** ✅ Real & working · ⚠️ Partial / has a real gap · ❌ Placeholder, not wired to a backend · 🐛 Bug

---

## Executive summary

The core loop — **record/import → AI transcription → AI Session Review → tasks → calendar** — is
real, live, and works end-to-end on a real Firebase backend with real Claude/OpenAI calls. Notes
(block editor), Search (⌘K), Calendar, and Recall AI (the RAG-style assistant) are all genuinely
strong and fully wired.

The biggest issue isn't half-built features — it's that **four whole pages (People, Teams,
Reviews, Notifications) are dead** for any real user: two are explicit "hackathon placeholder"
toasts, and two silently read from an abandoned localStorage data layer instead of Firestore, so
they always render empty no matter how much real activity exists. Projects is live but not yet
linked to the Sessions/Tasks that actually happen inside it. There's also one real data-loss trap:
recorded audio only lives in the browser's IndexedDB (Cloud Storage is disabled on the Firebase
project), so a transcription retry from a different device/browser fails permanently with no
recovery path.

---

## Feature-by-feature

| Area | Status | One-line verdict |
|---|---|---|
| Auth / onboarding | ✅ | Google OAuth verified live; onboarding tour media is cosmetic placeholder art only |
| Home dashboard | ✅ | Real data: greeting, needs-attention feed, today's schedule |
| **Recall AI** (assistant) | ✅ | Real Claude call, grounded on live workspace data, cited sources — verified live |
| Sessions — record/import | ✅ | Live recording → OpenAI transcription → Claude Session Review, verified live |
| Sessions — transcript retry | 🐛 | Audio is device-local (IndexedDB only, Storage disabled) — cross-device retry fails **permanently** |
| Sessions — seed data | ⚠️ | Workspace's older "sample-*" sessions have no transcript; "Generate Review" permanently errors on them |
| Notes | ✅ | Rich block editor, checklists, embedded charts, folders, trash, page backgrounds — all real |
| Projects — list/create/detail | ✅ | Live Firestore CRUD, verified (real "Recall Web App" project, create dialog works) |
| Projects — session/task linkage | ⚠️ | Project detail shows 0 sessions/0 tasks/0 decisions even though real sessions & tasks exist — the "related project" picker doesn't persist `project_id` yet |
| Projects — Import | ❌ | Explicit placeholder toast: *"not wired up to a backend yet"* |
| Tasks | ✅ | Live Firestore, detail panel, due dates, priority, "created from meeting" quote — verified live |
| Calendar | ✅ | Plots real sessions + task due dates, upcoming-deadlines & recent-sessions panels — verified live |
| Search (⌘K) | ✅ | Real live results across sessions/tasks/meetings — verified live |
| Usage counters | ✅ | Real live counts (recording hours, sessions, AI questions) |
| Usage — "Buy more usage" | ❌ | No payment processor anywhere in the codebase — "Add hours" just increments a Firestore bonus counter |
| Settings → Appearance | ✅ | Theme/accent/sidebar style, persists live |
| Settings → Account | ✅ | Name is actually editable (the team's own backlog still claims "read-only" — that's stale) |
| Settings → Payments | ⚠️ | Honest placeholder: *"Billing is handled securely outside Recall"* — no real Stripe/billing integration exists |
| **People** | ❌ | No backend model at all. "Invite people" → explicit *"placeholder for the hackathon demo"* toast |
| **Teams** | ❌ | Same as People — no backend, "New team" → same placeholder toast |
| **Reviews** (flagged-session queue) | ❌ | Reads the old `getWorkspaceData()` localStorage layer, never Firestore — always empty for a real user regardless of activity |
| **Notifications** | ❌ | Same dead pattern as Reviews — no generation logic wired to real events (task assigned, review ready, etc.) |
| Internal dev taskboard (`/app` isn't user-facing; devs only) | ✅ | A real live Firestore Kanban the team uses to track exactly this kind of gap — worth knowing it exists |

---

## Detail on the notable findings

### 🐛 Recorded audio is a silent, permanent data-loss trap
Cloud Storage was never enabled on the `recall-ca1ec` Firebase project, so recordings save to the
browser's IndexedDB instead (`data/live/local-audio.ts`). A session's audio only exists on the
device it was recorded on. Verified live: opening an older "Investor Meeting" session and clicking
**Retry transcription** returned *"The recording audio is not available on this device to
transcribe"* — there is no server-side copy to fall back to. A user who records on their phone and
opens Recall later on a laptop, or clears browser storage, permanently loses the ability to
transcribe that session. This isn't surfaced anywhere as a warning at record time.

### ❌ Reviews & Notifications are fully disconnected from live data
Both `data/reviews/reviews-service.ts` and `data/notifications/notifications-service.ts` import and
call `getWorkspaceData()`/`saveWorkspaceData()` — the original hackathon's localStorage blob — with
**zero** reference to `isLiveMode` or Firestore anywhere in either module. In a live, authenticated
workspace with real sessions and tasks, both pages will show "No reviews yet" / "No notifications"
forever, because they're reading a data store that's never written to outside demo mode. This is
the single largest gap for anyone actually using the product day-to-day (no way to know a review
needs a human check, no activity feed).

### ❌ People & Teams are UI-only
Confirmed both `views/app/people.tsx` and `views/app/teams.tsx` short-circuit their primary CTA into
a toast reading *"This is a placeholder for the hackathon demo — it's not wired up to a backend
yet."* There is no Firestore collection, no schema, nothing — the team's own backlog file calls
this out explicitly ("No backend collection today — frontend concept only").

### ⚠️ Projects: real, but an island
The Projects feature itself (list, create dialog, detail page) is genuinely live-wired to Firestore
— confirmed by creating and viewing a real project. But the project detail page for "Recall Web
App" shows **0 sessions, 0 tasks, 0 decisions, 0 docs** despite the workspace having ~10 real
sessions and ~9 real tasks. The "related project" selector on the recording setup screen doesn't
yet send `project_id` when a session is created, so nothing ever gets denormalized onto a project.
Projects today is a well-built shell with nothing flowing into it.

### ❌ Billing is entirely fake
`views/app/usage.tsx`'s `runPurchase()` doesn't call any payment API — it just calls a Firestore
mutation that bumps the workspace's bonus-minutes/bonus-questions counters, then shows a success
toast. Settings → Payments is upfront about this ("billing is handled... outside Recall"), so it's
not deceptive to a user who reads carefully, but there is no monetization path implemented
anywhere in the code.

### Not a bug, just confusing: two recording UIs
`views/app/record.tsx` is a thin switch — `isLiveMode ? LiveRecordSessionPage : DemoRecordSessionPage`
— so real users always get the correct (live) flow. But `record-live.tsx` (live) and the demo half
of `record.tsx` are two fully separate implementations the team has already flagged internally for
a merge. No user-facing impact today.

### Good news, contradicts a stale internal note
The dev backlog (`seed-data.ts`, written 2026-08-15) claims Settings → Account is "read-only except
theme." Verified live: first/last name are editable text fields with a working Save button. That
item has shipped since the backlog was last updated — worth pruning from the internal list.

---

## If you fix things in priority order

1. **Reviews & Notifications → Firestore.** Same shape of work as Projects already went through
   (there's a template to copy: `data/notes/notes-store.ts` per the team's own notes). This is the
   highest-leverage fix — two entire nav items currently do nothing for a real user.
2. **Decide on People/Teams.** Either scope and build a real backend, or pull them from the nav
   until they're real — right now they're discoverable dead ends.
3. **Wire Projects ↔ Sessions/Tasks.** The selector UI exists; it just needs to persist
   `project_id` on session creation and pass it through task promotion.
4. **Warn about (or fix) audio device-locality.** At minimum, surface a warning when recording that
   playback/retry only works on this device; ideally re-enable Cloud Storage so audio survives
   device changes.
5. **Low priority / cleanup:** merge `record.tsx`/`record-live.tsx`, decide whether "Buy more
   usage" should become real billing or be relabeled as a dev/demo affordance.

---

## What I didn't independently test
Person/Team detail pages, Settings sub-tabs beyond Account/Appearance/Payments (Workspace, Notes,
Productivity, AI, Accessibility, Personalization, Experimental, Advanced), session Share/Export
buttons, and 2FA — these weren't clicked live this pass; verdicts above for anything not in the
table are inherited from the team's own backlog notes and should be spot-checked before relying on
them.
