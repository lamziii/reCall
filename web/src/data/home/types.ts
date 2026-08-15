import type { SessionStatusValue } from '@/components/recall/session-status'
import type { ProjectStatus } from '../types'

export type AttentionType = 'decision' | 'task' | 'question' | 'risk'

export interface AttentionItem {
  id: string
  type: AttentionType
  title: string
  projectName?: string
  ownerName?: string
  dueLabel?: string
  sourceSessionTitle?: string
  href: string
}

export type PrimaryAttentionReason = 'processing' | 'needs-review' | 'overdue-task' | 'upcoming-meeting' | 'recent-session'

export interface PrimaryAttentionSession {
  kind: 'session'
  reason: PrimaryAttentionReason
  id: string
  title: string
  status: SessionStatusValue
  projectName?: string
  dateLabel: string
  durationLabel: string
  participantNames: string[]
  summary: string
  decisionsAwaitingReview: number
  openTasks: number
  href: string
  transcriptHref: string
}

export interface PrimaryAttentionTask {
  kind: 'task'
  reason: 'overdue-task'
  id: string
  title: string
  projectName?: string
  dueLabel: string
  href: string
}

export type PrimaryAttention = PrimaryAttentionSession | PrimaryAttentionTask

export interface ScheduledSession {
  id: string
  title: string
  timeLabel: string
  fullDateTimeLabel: string
  projectName?: string
  participantNames: string[]
  status: SessionStatusValue
  href: string
}

export interface SessionSummary {
  id: string
  title: string
  projectName?: string
  participantNames: string[]
  dateLabel: string
  durationLabel: string
  status: SessionStatusValue
  summaryPreview: string
  href: string
}

export interface ProjectSummary {
  id: string
  name: string
  ownerName: string
  status: ProjectStatus
  targetDateLabel: string
  progressPct: number
  nextMilestoneLabel: string
  latestSessionTitle?: string
  href: string
}

export interface ActivityFeedItem {
  id: string
  /** Undefined for system-authored activity (e.g. AI extraction) — render a neutral icon instead of a person avatar. */
  actorName?: string
  /** Full, ready-to-render sentence, e.g. "Sarah approved a decision from Q3 Product Strategy Sync." */
  sentence: string
  href: string
  relativeTimeLabel: string
  fullTimestampLabel: string
}

export interface HomeDashboardData {
  greeting: { userName: string; workspaceName: string; dateLabel: string }
  primaryAttention: PrimaryAttention | null
  todaySchedule: ScheduledSession[]
  needsAttention: AttentionItem[]
  recentSessions: SessionSummary[]
  activeProjects: ProjectSummary[]
  recentActivity: ActivityFeedItem[]
}
