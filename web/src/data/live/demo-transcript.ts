/**
 * Deterministic demo transcript for the live AI flow. Exposed only through the "Use demo
 * transcript" control on the New Session page — never auto-injected into real user data.
 * See DEMO_RUNBOOK.md. Designed to yield a rich review: 3 people, a project, topics,
 * 2 clear decisions, several tasks with 1-2 deadlines, open questions, a risk, an insight.
 */
export const DEMO_TRANSCRIPT_TITLE = 'Mobile v2 — Weekly Planning Sync'

export const DEMO_TRANSCRIPT = `Priya (PM): Thanks for hopping on, everyone. This is our weekly planning sync for the Mobile v2 launch. Quick agenda: onboarding redesign, the offline-sync bug, and the App Store submission timeline.

Marcus (Eng): Sounds good. I'll start with offline sync. We found the root cause — the local cache wasn't invalidating when a session token refreshed, so stale data showed up after re-login. I've got a fix in review.

Priya: Great. When can that land?

Marcus: I can merge it by Friday, August 7th, assuming review goes smoothly.

Priya: Let's treat that as the deadline then — offline-sync fix merged by August 7th. Marcus, that's yours.

Elena (Design): On onboarding — I finished the new three-step flow. The big change is we dropped the account-creation wall to the very end, so people can try the app first. Early usability tests looked strong.

Priya: I like that. Decision: we're going with the try-first onboarding flow for v2. Elena, can you hand the final Figma specs to Marcus this week?

Elena: Yes, I'll deliver the onboarding specs to engineering by Wednesday.

Marcus: One risk I want to flag — if the App Store review takes longer than the usual two days, we could miss the September marketing date. Apple has been slower lately.

Priya: Noted, that's a real risk. Let's build in a buffer. Open question: do we need a fallback plan if Apple rejects the first submission? Let's think on that.

Elena: Also open — should the onboarding support dark mode at launch, or can that wait?

Priya: Good question, let's decide next week. Action items: Marcus, prep the App Store submission checklist. Elena, run one more usability pass on the onboarding copy. I'll draft the launch announcement.

Marcus: Insight from the beta group, by the way — users who saw the try-first flow were about 40% more likely to finish setup. Strong signal for the decision we just made.

Priya: Love it. Let's wrap. Thanks everyone.`
