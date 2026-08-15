import { cn } from '@/lib/utils'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

const CONFIG: Record<Priority, { label: string; color: string; bars: number }> = {
  low: { label: 'Low', color: 'bg-subtle-foreground', bars: 1 },
  medium: { label: 'Medium', color: 'bg-accent', bars: 2 },
  high: { label: 'High', color: 'bg-warning', bars: 3 },
  urgent: { label: 'Urgent', color: 'bg-danger', bars: 4 },
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { label, color, bars } = CONFIG[priority]

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-caption font-medium text-foreground', className)}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cn('w-0.5 rounded-full bg-surface-active', bar <= bars && color)}
            style={{ height: `${3 + bar * 1.5}px` }}
          />
        ))}
      </span>
      {label}
    </span>
  )
}
