import type { SessionReview } from './review'

/**
 * EMERGENCY VISUAL FALLBACK ONLY. A pre-generated review for DEMO_TRANSCRIPT, for the case
 * where the live AI endpoint is unreachable during a demo and you need something on screen.
 *
 * It is NOT wired into the app and is NEVER silently substituted when a real request fails —
 * doing so would make a broken flow look successful. To use it, a presenter would paste it in
 * manually. The real demonstration always uses the live extractSessionReview endpoint.
 * See DEMO_RUNBOOK.md.
 */
export const DEMO_REVIEW_FIXTURE: SessionReview = {
  executive_summary:
    'The team aligned on the Mobile v2 launch plan. They chose a try-first onboarding flow and set a hard deadline to merge the offline-sync fix. Remaining risks center on App Store review timing ahead of the September marketing date.',
  discussion_topics: [
    { title: 'Offline-sync bug', summary: 'Root-caused to a stale local cache not invalidating on token refresh; a fix is in review.' },
    { title: 'Onboarding redesign', summary: 'A new three-step, try-first flow that defers account creation to the end; early usability tests were strong.' },
    { title: 'App Store submission timeline', summary: 'Concern that a slow Apple review could jeopardize the September marketing date.' },
  ],
  decisions: [
    { decision: 'Adopt the try-first onboarding flow for v2', details: 'Account creation moves to the end so users can try the app first.', evidence: 'Decision: we’re going with the try-first onboarding flow for v2.' },
    { decision: 'Treat Aug 7 as the deadline for the offline-sync fix', details: 'Fix to be merged pending review.', evidence: 'offline-sync fix merged by August 7th. Marcus, that’s yours.' },
  ],
  tasks: [
    { title: 'Merge the offline-sync fix', owner: 'Marcus', deadline: '2026-08-07', priority: 'red', evidence: 'I can merge it by Friday, August 7th' },
    { title: 'Deliver final onboarding Figma specs to engineering', owner: 'Elena', deadline: null, priority: 'amber', evidence: 'deliver the onboarding specs to engineering by Wednesday' },
    { title: 'Prep the App Store submission checklist', owner: 'Marcus', deadline: null, priority: 'amber', evidence: 'Marcus, prep the App Store submission checklist.' },
    { title: 'Run one more usability pass on onboarding copy', owner: 'Elena', deadline: null, priority: 'gray', evidence: 'run one more usability pass on the onboarding copy' },
    { title: 'Draft the launch announcement', owner: 'Priya', deadline: null, priority: 'gray', evidence: 'I’ll draft the launch announcement.' },
  ],
  timeline: [
    { label: 'Offline-sync root cause and fix', detail: 'Stale cache on token refresh' },
    { label: 'Onboarding decision', detail: 'Try-first flow adopted' },
    { label: 'Risks and open questions raised', detail: 'App Store timing' },
    { label: 'Action items assigned', detail: null },
  ],
  insights: [
    'Beta users who saw the try-first flow were ~40% more likely to finish setup — a strong signal supporting the onboarding decision.',
  ],
  risks: [
    { risk: 'A slow App Store review could cause the launch to miss the September marketing date', severity: 'high', evidence: 'if the App Store review takes longer than the usual two days, we could miss the September marketing date' },
  ],
  questions: [
    { question: 'Do we need a fallback plan if Apple rejects the first submission?', context: 'Raised as a risk buffer.' },
    { question: 'Should onboarding support dark mode at launch, or can it wait?', context: 'To be decided next week.' },
  ],
}
