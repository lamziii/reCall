import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetricProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  trend?: { direction: 'up' | 'down'; value: string }
  className?: string
}

/** Dashboard tile: icon, label, big value, optional trend badge. */
export function Metric({ label, value, icon, trend, className }: MetricProps) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-caption text-subtle-foreground">{label}</span>
        {icon && <span className="text-subtle-foreground [&>svg]:size-4">{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-h2 font-semibold tabular-nums text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              'mb-1 flex items-center gap-0.5 text-caption font-medium',
              trend.direction === 'up' ? 'text-success' : 'text-danger',
            )}
          >
            {trend.direction === 'up' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
