import type { SessionStatusValue } from '@/components/recall/session-status'
import type { TaskStatusValue } from '@/components/recall/task-status'
import type { DecisionStatusValue } from '@/components/recall/decision-status'
import type { Priority } from '@/components/data-display/priority-badge'
import type { IssueSeverity } from '../types'

export type SessionSortOption = 'recent' | 'oldest' | 'longest' | 'shortest' | 'attention'
export type SessionStatusFilter = 'all' | SessionStatusValue
export type SessionDateFilter = 'all' | 'today' | 'week' | 'month'
export type SessionDateGroup = 'upcoming' | 'today' | 'yesterday' | 'this-week' | 'earlier'

export interface SessionListItem {
  id: string
  title: string
  summaryPreview: string
  projectId?: string
  projectName?: string
  participantNames: string[]
  dateLabel: string
  timeLabel: string
  durationLabel: string
  durationMinutes: number
  status: SessionStatusValue
  decisionsCount: number
  tasksCount: number
  needsAttention: boolean
  rawDate: string
  dateGroup: SessionDateGroup
}

export interface SessionsListData {
  sessions: SessionListItem[]
  projectOptions: { id: string; name: string }[]
}

export interface SessionDecisionItem {
  id: string
  title: string
  status: DecisionStatusValue
  ownerName?: string
  confidence?: number
  timestampLabel: string
  projectName?: string
  linkedTaskCount: number
}

export interface SessionTaskItem {
  id: string
  title: string
  assigneeName?: string
  priority: Priority
  status: TaskStatusValue
  dueDateLabel?: string
}

export interface SessionQuestionItem {
  id: string
  title: string
  ownerName?: string
  projectName?: string
  timestampLabel: string
}

export interface SessionRiskItem {
  id: string
  title: string
  ownerName?: string
  projectName?: string
  severity: IssueSeverity
}

export interface TranscriptEntry {
  id: string
  speakerName: string
  timestampLabel: string
  offsetMinutes: number
  text: string
}

export interface SessionTimelineItem {
  id: string
  label: string
  timestampLabel: string
  offsetMinutes: number
  kind: 'start' | 'topic' | 'decision' | 'task' | 'end'
}

export interface SessionDetailData {
  id: string
  title: string
  projectName?: string
  dateLabel: string
  fullDateTimeLabel: string
  durationLabel: string
  status: SessionStatusValue
  participants: { name: string }[]
  summary: string
  decisions: SessionDecisionItem[]
  tasks: SessionTaskItem[]
  questions: SessionQuestionItem[]
  risks: SessionRiskItem[]
  insights: string[]
  timeline: SessionTimelineItem[]
  transcript: TranscriptEntry[]
}
