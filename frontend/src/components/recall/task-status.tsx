import { StatusBadge, type StatusTone } from '@/components/data-display/status-badge'

export type TaskStatusValue = 'backlog' | 'todo' | 'in-progress' | 'blocked' | 'done' | 'canceled'

const CONFIG: Record<TaskStatusValue, { label: string; tone: StatusTone }> = {
  backlog: { label: 'Backlog', tone: 'neutral' },
  todo: { label: 'Todo', tone: 'neutral' },
  'in-progress': { label: 'In progress', tone: 'info' },
  blocked: { label: 'Blocked', tone: 'danger' },
  done: { label: 'Done', tone: 'success' },
  canceled: { label: 'Canceled', tone: 'neutral' },
}

export function TaskStatus({ status, className }: { status: TaskStatusValue; className?: string }) {
  const { label, tone } = CONFIG[status]
  return <StatusBadge tone={tone} label={label} className={className} />
}
