import type { ReviewStatusValue } from '@/components/recall/review-status'
import type { SessionDecisionItem, SessionQuestionItem, SessionTaskItem } from '../sessions/types'

export type ReviewStatusFilter = 'all' | ReviewStatusValue

export interface ReviewListItem {
  id: string
  sessionId: string
  title: string
  projectName?: string
  confidence: number
  issuesFound: number
  status: ReviewStatusValue
  dateLabel: string
  rawDate: string
}

export interface ReviewsListData {
  reviews: ReviewListItem[]
}

export interface ReviewDetailData {
  id: string
  sessionId: string
  title: string
  projectName?: string
  status: ReviewStatusValue
  confidence: number
  dateLabel: string
  summary: string
  decisions: SessionDecisionItem[]
  tasks: SessionTaskItem[]
  questions: SessionQuestionItem[]
}
