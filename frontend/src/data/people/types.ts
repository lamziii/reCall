import type { PersonStatus, ProjectStatus } from '../types'
import type { SessionListItem, SessionTaskItem } from '../sessions/types'

export type PeopleSortOption = 'name' | 'department' | 'sessions' | 'tasks'

export interface PersonListItem {
  id: string
  name: string
  role: string
  department: string
  email: string
  status: PersonStatus
  teamName?: string
  sessionsAttended: number
  tasksAssigned: number
  projectsCount: number
}

export interface PeopleListData {
  people: PersonListItem[]
  departmentOptions: string[]
}

export interface PersonProjectSummary {
  id: string
  name: string
  status: ProjectStatus
  isOwner: boolean
}

export interface PersonDetailData {
  id: string
  name: string
  role: string
  department: string
  email: string
  status: PersonStatus
  teamName?: string
  teamId?: string
  projects: PersonProjectSummary[]
  sessions: SessionListItem[]
  tasks: SessionTaskItem[]
}
