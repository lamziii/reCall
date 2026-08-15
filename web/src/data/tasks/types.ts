import type { TaskStatusValue } from '@/components/recall/task-status'
import type { Priority } from '@/components/data-display/priority-badge'

export type TaskSortOption = 'due-soonest' | 'due-latest' | 'priority' | 'recent'
export type TaskStatusFilter = 'all' | TaskStatusValue
export type TaskPriorityFilter = 'all' | Priority
export type TaskAssigneeFilter = 'all' | 'unassigned' | string

export interface TaskListItem {
  id: string
  title: string
  projectId?: string
  projectName?: string
  assigneeId?: string
  assigneeName?: string
  priority: Priority
  status: TaskStatusValue
  dueDateRaw?: string
  sourceSessionId?: string
  sessionTitle?: string
  isOverdue: boolean
}

export interface TasksListData {
  tasks: TaskListItem[]
  projectOptions: { id: string; name: string }[]
  assigneeOptions: { id: string; name: string }[]
}

export interface TaskActivityEntry {
  id: string
  label: string
  timestampLabel: string
}

export interface TaskDetailData {
  id: string
  title: string
  description: string
  status: TaskStatusValue
  priority: Priority
  assigneeName?: string
  assigneeId?: string
  dueDateLabel?: string
  dueDateRaw?: string
  isOverdue: boolean
  blocker?: string
  projectId?: string
  projectName?: string
  sourceSessionId?: string
  sessionTitle?: string
  sessionDateLabel?: string
  conversationExcerpt?: { speakerName: string; text: string }
  activity: TaskActivityEntry[]
}
