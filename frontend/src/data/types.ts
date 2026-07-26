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

export type PersonStatus = 'active' | 'away' | 'offline'

export interface Person {
  id: string
  name: string
  role: string
  email: string
  department: string
  status: PersonStatus
  teamId?: string
  _sample?: SampleMeta
}

export interface Team {
  id: string
  name: string
  description: string
  memberIds: string[]
  createdAt: string
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

/** Shape-compatible with sessions/types.ts's TranscriptEntry — kept separate to avoid a circular import between the two type modules. */
export interface RecordedTranscriptSegment {
  id: string
  speakerName: string
  timestampLabel: string
  offsetMinutes: number
  text: string
}

export type SessionSource = 'sample-data' | 'live-recording' | 'import'

export interface SessionAudioMeta {
  mimeType: string
  durationSeconds: number
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
  /** Only meaningful when status is 'needs-review' — powers the Reviews queue. Defaults to 'pending'. */
  reviewStatus?: 'pending' | 'approved' | 'needs-edits'
  reviewConfidence?: number
  /** Present on sessions saved from the live-recording flow — absent on sample/imported sessions. */
  transcript?: RecordedTranscriptSegment[]
  source?: SessionSource
  createdBy?: string
  language?: string
  /** Set when a recording's audio Blob was saved to IndexedDB (see data/recording/audio-storage-service), keyed by session id. */
  audio?: SessionAudioMeta
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

export type NotificationType =
  | 'session-processed'
  | 'task-assigned'
  | 'decision-approved'
  | 'mention'
  | 'project-update'
  | 'review-required'

export type NotificationRefType = 'session' | 'task' | 'project' | 'decision'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: string
  read: boolean
  actorId?: string
  refType?: NotificationRefType
  refId?: string
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
  teams: Team[]
  projects: Project[]
  sessions: SessionRecord[]
  tasks: Task[]
  decisions: Decision[]
  questions: Question[]
  risks: Risk[]
  activity: ActivityItem[]
  notifications: Notification[]
}
