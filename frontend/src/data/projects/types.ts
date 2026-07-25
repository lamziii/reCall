import type { ProjectStatus } from '../types'
import type { SessionDecisionItem, SessionListItem, SessionQuestionItem, SessionTaskItem } from '../sessions/types'

export type ProjectSortOption = 'updated' | 'name' | 'progress' | 'target-date'
export type ProjectStatusFilter = 'all' | ProjectStatus
export type ProjectView = 'grid' | 'list'

export interface ProjectListItem {
  id: string
  name: string
  description: string
  status: ProjectStatus
  ownerId: string
  ownerName: string
  teamNames: string[]
  progressPct: number
  targetDateLabel: string
  updatedLabel: string
  updatedRaw: string
  sessionsCount: number
  decisionsCount: number
  tasksCount: number
  documentsCount: number
  nextMeetingLabel?: string
}

export interface ProjectsListData {
  projects: ProjectListItem[]
  ownerOptions: { id: string; name: string }[]
}

export interface ProjectTimelineItem {
  id: string
  label: string
  detail: string
  timestampLabel: string
  timestampRaw: string
  kind: 'session' | 'decision' | 'task'
}

export interface ProjectMember {
  name: string
  role: string
  isOwner: boolean
}

export interface ProjectDetailData {
  id: string
  name: string
  description: string
  status: ProjectStatus
  ownerName: string
  createdAtLabel: string
  targetDateLabel: string
  progressPct: number
  aiSummary: string
  members: ProjectMember[]
  sessions: SessionListItem[]
  decisions: SessionDecisionItem[]
  tasks: SessionTaskItem[]
  questions: SessionQuestionItem[]
  timeline: ProjectTimelineItem[]
  documentsCount: number
}
