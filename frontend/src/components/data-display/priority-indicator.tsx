import { Flag } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type IndicatorPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

const CONFIG: Record<IndicatorPriority, { label: string; color: string }> = {
  none: { label: 'No priority', color: 'text-disabled-foreground' },
  low: { label: 'Low priority', color: 'text-subtle-foreground' },
  medium: { label: 'Medium priority', color: 'text-accent' },
  high: { label: 'High priority', color: 'text-warning' },
  urgent: { label: 'Urgent priority', color: 'text-danger' },
}

export interface PriorityIndicatorProps {
  priority: IndicatorPriority
  className?: string
}

/** Icon-only priority mark for dense rows — pair with PriorityBadge where a label fits. Never colors the row itself. */
export function PriorityIndicator({ priority, className }: PriorityIndicatorProps) {
  const { label, color } = CONFIG[priority]

  return (
    <Tooltip content={label}>
      <span tabIndex={0} aria-label={label} className={cn('focus-ring inline-flex items-center justify-center rounded-sm', className)}>
        <Flag className={cn('size-3.5', color)} fill={priority === 'none' ? 'none' : 'currentColor'} />
      </span>
    </Tooltip>
  )
}
