import type { ProjectStatus } from '../types'
import type { SessionDecisionItem, SessionListItem } from '../sessions/types'

export interface TeamListItem {
  id: string
  name: string
  description: string
  memberCount: number
  memberNames: string[]
  projectsCount: number
  sessionsCount: number
  lastActivityLabel?: string
}

export interface TeamsListData {
  teams: TeamListItem[]
}

export interface TeamMemberSummary {
  id: string
  name: string
  role: string
}

export interface TeamProjectSummary {
  id: string
  name: string
  status: ProjectStatus
}

export interface TeamDetailData {
  id: string
  name: string
  description: string
  members: TeamMemberSummary[]
  projects: TeamProjectSummary[]
  sessions: SessionListItem[]
  recentDecisions: SessionDecisionItem[]
}
