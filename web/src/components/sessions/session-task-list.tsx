import { CheckSquare } from 'lucide-react'
import { Select } from '@/components/forms/select'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { Assignee } from '@/components/recall/assignee'
import { Small } from '@/components/typography'
import { EmptyState } from '@/components/feedback/empty-state'
import type { SessionTaskItem } from '@/data/sessions/types'
import type { TaskStatusValue } from '@/components/recall/task-status'

const STATUS_OPTIONS: { value: TaskStatusValue; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
]

export interface SessionTaskListProps {
  tasks: SessionTaskItem[]
  onStatusChange: (taskId: string, status: TaskStatusValue) => void
}

export function SessionTaskList({ tasks, onStatusChange }: SessionTaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare />}
        title="No tasks captured"
        description="Action items extracted from this session will appear here."
        className="py-8"
      />
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      {tasks.map((task) => (
        <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Small className="font-medium text-foreground">{task.title}</Small>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-subtle-foreground">
              <Assignee name={task.assigneeName} compact />
              <PriorityBadge priority={task.priority} />
              {task.dueDateLabel && <span>{task.dueDateLabel}</span>}
            </div>
          </div>
          <Select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatusValue)}
            options={STATUS_OPTIONS}
            size="sm"
            aria-label={`Status for ${task.title}`}
            className="w-36 shrink-0"
          />
        </div>
      ))}
    </div>
  )
}
