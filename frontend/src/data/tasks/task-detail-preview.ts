import type { TaskDetailData, TaskListItem } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'

const STATUS_LABEL: Record<TaskStatusValue, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in-progress': 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  canceled: 'Canceled',
}

/**
 * Builds a fully-populated task detail view from a task LIST item, synthesizing the richer fields
 * the list doesn't carry (description, a source-meeting excerpt, an activity log) as placeholder
 * "dummy" content. Used by the Tasks detail panel so clicking any task — in live mode, where the
 * list comes from Firestore — always opens a populated panel instead of a "not found" state.
 * Pure ⇒ unit-testable. The dummy fields are clearly illustrative, not real history.
 */
export function buildTaskDetailPreview(task: TaskListItem): TaskDetailData {
  const owner = task.assigneeName?.trim() || 'the team'
  const lowerTitle = task.title.charAt(0).toLowerCase() + task.title.slice(1)

  const description = task.sessionTitle
    ? `Action item from “${task.sessionTitle}”, owned by ${owner}. Add the full details, context, and acceptance criteria for this task here.`
    : `Owned by ${owner}. Add the full details, context, and acceptance criteria for this task here.`

  const conversationExcerpt = task.sessionTitle
    ? { speakerName: task.assigneeName?.trim() || 'Speaker 1', text: `Let's make sure we ${lowerTitle} before the next check-in.` }
    : undefined

  const activity = [
    { id: `${task.id}-a1`, label: task.sessionTitle ? 'Created from session review' : 'Task created', timestampLabel: '2 days ago' },
    { id: `${task.id}-a2`, label: task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Left unassigned', timestampLabel: '2 days ago' },
    { id: `${task.id}-a3`, label: `Status set to ${STATUS_LABEL[task.status]}`, timestampLabel: 'Yesterday' },
  ]

  return {
    id: task.id,
    title: task.title,
    description,
    status: task.status,
    priority: task.priority,
    assigneeName: task.assigneeName,
    assigneeId: task.assigneeId,
    dueDateRaw: task.dueDateRaw,
    isOverdue: task.isOverdue,
    projectId: task.projectId,
    projectName: task.projectName,
    sourceSessionId: task.sourceSessionId,
    sessionTitle: task.sessionTitle,
    conversationExcerpt,
    activity,
  }
}
