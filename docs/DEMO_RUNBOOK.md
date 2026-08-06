# Recall — Demo Runbook

For driving the live demo. Setup is in [DEMO_SETUP.md](DEMO_SETUP.md). Recording is the primary
flow; Import Transcript is the backup. Run both smoke tests (SETUP §13 and §14) **before**
presenting, in the browser/profile you'll present from (so mic permission is already granted).

---

## 3-minute presentation flow (recording-first)

1. **(0:00) Sign in.** Clean browser window → **Continue with Google**. One line: *"Recall is an
   AI meeting recorder — record a conversation and it hands you decisions, action items, and a
   review."*

2. **(0:20) Start Session.** Sidebar → **Start Session** (or **Record**). Enter a title, choose
   **Investor Conversation**, optionally add participant names. Click **Start Recording** and
   allow the microphone.

3. **(0:40) Record.** Speak a short prepared exchange (~30s). Point out the live timer, mic state,
   visualizer, and the live transcript appearing.

4. **(1:20) Stop & process.** Click **Stop**. The audio uploads, the session + transcript save,
   and analysis starts automatically — the processing panel shows the stages, then the review
   appears with no manual refresh.

5. **(1:50) Walk the review.** **Overview** (summary, topics, timeline, insights, risks, open
   questions) → **Decisions** → **Transcript** (play the recording; optionally map **Speaker 1 →
   a name** and **Save & re-analyze**). Note owners/deadlines are grounded, not invented.

6. **(2:30) Promote a task + board.** **Tasks** tab → **Add to Tasks** (flips to **Added**) →
   sidebar **Tasks** shows it with priority/status/owner/deadline.

7. **(2:50) Persistence + auth.** Refresh (session/review/audio persist) → account menu →
   **Log out** → `/app` redirects to `/login`. Done.

> **No-mic room?** Use the Import Transcript path instead (step 2 → **Import Transcript** →
> *Use demo transcript* → **Create session**). Same review + task workflow, no microphone.

---

## Backup demo transcript

The investor-conversation fixture the **Use demo transcript** button loads lives at
`frontend/fixtures/demo-investor-conversation.txt` (Uvejs + an investor discussing Recall,
positioning, pricing, diarization, two decisions, several tasks, a deadline, two open questions,
a risk, an insight). Copy it from there if you need to paste manually.

## Expected AI outputs (approximate — the live model may word things differently)

From the investor-conversation fixture:
- **Summary:** a pitch/positioning conversation about Recall — AI meeting recorder, decision +
  action layer, diarization roadmap, pricing discussion.
- **Decisions (2):** keep a limited-but-real free tier; ship server-side diarization before the
  team plan.
- **Tasks (4–6):** send the updated deck by Friday; make design-partner intros by the 15th;
  write a diarization-provider comparison doc; etc. Owners like Uvejs / Investor where stated,
  else **Unassigned**; one deadline (the 15th) as an ISO date, others `null`.
- **Risk (1):** a larger notetaker could copy the action-item layer (thin moat).
- **Open questions (2):** is the moat integrations or review quality; audio data-retention story.
- **Insight (1):** users say auto-generated action items are the feature they'd miss most.

A frozen copy of a good result is in `frontend/src/data/live/demo-review-fixture.ts` for
reference. It is an **emergency visual reference only** — the app never substitutes it for a
real request.

---

## Recovery steps

**AI generation fails** (error panel "Recall couldn't organize this session"):
- The transcript is already saved — click **Try again** (re-runs on the same session, no
  duplicate).
- Check the function logs: from `firebase/`, `firebase functions:log`. Common causes: the
  `ANTHROPIC_API_KEY` secret isn't set/bound (re-run SETUP §8 + redeploy functions), the
  project isn't on Blaze, or an Anthropic rate limit.
- Last resort for a live audience: talk through `demo-review-fixture.ts` on screen — do not
  claim it came from the live call.

**Google popup blocked:**
- The app automatically falls back to a full-page redirect sign-in; complete it and you'll land
  back signed in. If nothing happens, allow popups for the site and retry, or confirm the site
  domain is in **Authentication → Settings → Authorized domains**.

**Microphone permission fails / denied:**
- The recording screen shows a clear permission message with a Retry. If you can't grant it in
  the room, fall back to **Start Session → Import Transcript → Use demo transcript**. Same review
  and task workflow, no microphone.

**Web Speech unsupported (e.g. Safari) — live transcript empty:**
- Audio still records and uploads. If no transcript was captured, the review page shows the
  **Generate Review** CTA instead of auto-analyzing; use **Import Transcript** for a reliable
  transcript, or paste a corrected one. (Server-side diarizing transcription is the planned fix —
  see RECORDING_ARCHITECTURE.md.)

**Audio upload fails:**
- Non-blocking — you'll see "Recording saved without audio upload" and analysis still runs on the
  transcript. Playback just won't be available for that session. Check Storage exists (SETUP §7)
  and Storage rules are deployed (SETUP §10).

**"Setting up your workspace…" hangs / "We couldn't open your workspace":**
- Network/Firestore issue. Click **Try again**. Confirm Firestore exists (SETUP §6) and rules
  are deployed (SETUP §10).

**Deep link 404 after refresh:**
- Hosting SPA rewrite missing — redeploy hosting (SETUP §12). Locally, `vite` handles this
  automatically.

---

## Pre-meeting checklist

- [ ] Blaze plan active; `ANTHROPIC_API_KEY` secret set and functions deployed.
- [ ] Google sign-in enabled; demo domain in Authorized domains.
- [ ] Firestore + rules + indexes deployed; Storage created.
- [ ] Ran the full smoke test (SETUP §13) end-to-end today.
- [ ] Signed out and in a clean browser window/profile for the live run.
- [ ] Backup: `demo-review-fixture.ts` open in an editor tab, just in case.
