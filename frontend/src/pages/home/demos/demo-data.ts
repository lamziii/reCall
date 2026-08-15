// One coherent fictional story shared across every homepage demo so the page reads as Recall slowly
// building a memory of the SAME company. Northstar's "Public Launch" — the launch date, the owner,
// and the migration risk recur in the hero, the extraction breakdown, and (later) Ask Recall. Pure
// data, no app state.

/** Friday of the current week-ish — a believable near-term deadline the DueDate component renders. */
export const DEMO_FRIDAY = new Date(Date.now() + 3 * 86_400_000)

export const DEMO_PEOPLE = {
  sarah: 'Sarah Chen',
  daniel: 'Daniel Kim',
  maya: 'Maya Patel',
  alex: 'Alex Morgan',
} as const

export interface DemoTranscriptLine {
  /** ms into the demo timeline when this line appears. */
  at: number
  time: string
  speaker: string
  text: string
  /** The pivotal line that triggers a decision/task/risk — rendered emphasized. */
  accent?: boolean
}

// The "Product Launch Review" conversation — the launch move, the owned follow-up, the open risk.
export const DEMO_TRANSCRIPT: DemoTranscriptLine[] = [
  { at: 600, time: '00:04', speaker: DEMO_PEOPLE.sarah, text: "Let's move the launch to September 18th." },
  { at: 2100, time: '00:11', speaker: DEMO_PEOPLE.daniel, text: "Agreed. I'll update the release plan by Friday.", accent: true },
  { at: 3800, time: '00:19', speaker: DEMO_PEOPLE.maya, text: 'The migration window is still the main risk.' },
  { at: 5100, time: '00:26', speaker: DEMO_PEOPLE.alex, text: "I'll line up the announcement for launch morning." },
]
