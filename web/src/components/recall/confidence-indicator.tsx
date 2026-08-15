import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface ConfidenceIndicatorProps {
  value: number
  variant?: 'compact' | 'detailed'
  className?: string
}

function band(value: number) {
  if (value >= 80) return { label: 'High confidence', color: 'bg-success' }
  if (value >= 50) return { label: 'Medium confidence', color: 'bg-warning' }
  return { label: 'Low confidence', color: 'bg-danger' }
}

/** The percentage number is always visible text — color alone never carries the meaning. */
export function ConfidenceIndicator({ value, variant = 'compact', className }: ConfidenceIndicatorProps) {
  const { label, color } = band(value)

  const content =
    variant === 'compact' ? (
      <span tabIndex={0} className={cn('focus-ring inline-flex items-center gap-1.5 rounded-sm', className)}>
        <span className={cn('size-1.5 rounded-full', color)} />
        <span className="text-caption tabular-nums text-muted-foreground">{value}%</span>
      </span>
    ) : (
      <span tabIndex={0} className={cn('focus-ring inline-flex items-center gap-2 rounded-sm', className)}>
        <span className="h-1 w-12 overflow-hidden rounded-full bg-surface-active">
          <span className={cn('block h-full', color)} style={{ width: `${value}%` }} />
        </span>
        <span className="text-caption tabular-nums text-muted-foreground">
          {value}% · {label}
        </span>
      </span>
    )

  return <Tooltip content={label}>{content}</Tooltip>
}
