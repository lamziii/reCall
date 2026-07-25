import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DueDateProps {
  date?: Date
  className?: string
}

export function DueDate({ date, className }: DueDateProps) {
  if (!date) {
    return <span className={cn('text-small text-subtle-foreground', className)}>No due date</span>
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86_400_000)
  const formatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const { label, tone } =
    diffDays < 0
      ? { label: `Overdue · ${formatted}`, tone: 'text-danger font-medium' }
      : diffDays === 0
        ? { label: 'Due today', tone: 'text-warning font-medium' }
        : diffDays === 1
          ? { label: 'Due tomorrow', tone: 'text-foreground' }
          : { label: `Due ${formatted}`, tone: 'text-muted-foreground' }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-small', tone, className)}>
      <CalendarClock className="size-3.5" />
      {label}
    </span>
  )
}
