import type { SessionStatusValue } from '@/components/recall/session-status'
import type { TaskStatusValue } from '@/components/recall/task-status'
import type { DecisionStatusValue } from '@/components/recall/decision-status'
import type { Priority } from '@/components/data-display/priority-badge'

/** Present on every record the sample-data generator creates. Absent on real, user-created records. */
export interface SampleMeta {
  source: 'sample-data'
  sampleDataVersion: number
  sampleDataBatchId: string
  createdAt: string
}

export interface Person {
  id: string
  name: string
  role: string
  email: string
  _sample?: SampleMeta
}

export type ProjectStatus = 'planning' | 'active' | 'at-risk' | 'on-hold' | 'done' | 'archived'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  ownerId: string
  progressPct: number
  targetDate: string
  createdAt: string
  latestSessionId?: string
  _sample?: SampleMeta
}

export interface TimelineEvent {
  label: string
  offsetMinutes: number
}

export interface SessionRecord {
  id: string
  title: string
  projectId?: string
  date: string
  durationMinutes: number
  participantIds: string[]
  status: SessionStatusValue
  summary: string
  decisionIds: string[]
  taskIds: string[]
  questionIds: string[]
  riskIds: string[]
  insights: string[]
  timeline: TimelineEvent[]
  _sample?: SampleMeta
}

export interface Task {
  id: string
  title: string
  projectId?: string
  assigneeId?: string
  dueDate?: string
  sourceSessionId?: string
  status: TaskStatusValue
  priority: Priority
  blocker?: string
  relatedDecisionId?: string
  completedAt?: string
  _sample?: SampleMeta
}

export interface Decision {
  id: string
  title: string
  status: DecisionStatusValue
  ownerId: string
  projectId?: string
  sourceSessionId?: string
  confidence?: number
  createdAt: string
  linkedTaskIds: string[]
  _sample?: SampleMeta
}

export type IssueSeverity = 'low' | 'medium' | 'high'
export type IssueStatus = 'open' | 'resolved'

export interface Question {
  id: string
  title: string
  ownerId?: string
  severity: IssueSeverity
  projectId?: string
  sourceSessionId?: string
  status: IssueStatus
  nextAction?: string
  createdAt: string
  _sample?: SampleMeta
}

export interface Risk {
  id: string
  title: string
  ownerId?: string
  severity: IssueSeverity
  projectId?: string
  sourceSessionId?: string
  status: IssueStatus
  nextAction?: string
  createdAt: string
  _sample?: SampleMeta
}

export type ActivityAction =
  | 'approved-decision'
  | 'completed-task'
  | 'extracted-tasks'
  | 'updated-project'
  | 'identified-risk'
  | 'created-session'

export interface ActivityItem {
  id: string
  actorId: string
  action: ActivityAction
  entityLabel: string
  entityType: 'decision' | 'task' | 'project' | 'session' | 'risk'
  entityId: string
  timestamp: string
  _sample?: SampleMeta
}

export interface Workspace {
  id: string
  name: string
  plan: string
  industry: string
  teamSize: number
  timezone: string
  /** Stand-in for a real auth/session identity — see docs/frontend note on sample data. */
  currentUserId: string
  _sample?: SampleMeta
}

export interface WorkspaceData {
  workspace: Workspace
  people: Person[]
  projects: Project[]
  sessions: SessionRecord[]
  tasks: Task[]
  decisions: Decision[]
  questions: Question[]
  risks: Risk[]
  activity: ActivityItem[]
}
