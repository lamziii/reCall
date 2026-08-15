// Frontend mirror of the server's Session Review element shapes
// (firebase/functions/src/reviewSchema.ts). Keep the two in sync — this is the wire contract
// (docs/CONTRACTS.md Contract 1) the AI produces and the Session Review page renders.

export type ReviewPriority = 'red' | 'amber' | 'gray'
export type ReviewSeverity = 'low' | 'medium' | 'high'

export interface DiscussionTopic {
  title: string
  summary: string
}
export interface ReviewDecision {
  decision: string
  details: string
  evidence: string | null
}
export interface CandidateTask {
  title: string
  owner: string | null
  deadline: string | null
  priority: ReviewPriority
  evidence: string | null
}
export interface TimelineItem {
  label: string
  detail: string | null
}
export interface ReviewRisk {
  risk: string
  severity: ReviewSeverity
  evidence: string | null
}
export interface ReviewQuestion {
  question: string
  context: string | null
}

export interface SessionReview {
  executive_summary: string
  discussion_topics: DiscussionTopic[]
  decisions: ReviewDecision[]
  tasks: CandidateTask[]
  timeline: TimelineItem[]
  insights: string[]
  risks: ReviewRisk[]
  questions: ReviewQuestion[]
}
