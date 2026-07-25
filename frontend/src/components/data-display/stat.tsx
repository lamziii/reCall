import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface StatProps {
  label: string
  value: ReactNode
  className?: string
}

/** Compact label/value pair — for dense summary rows. For a dashboard tile, use Metric. */
export function Stat({ label, value, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-caption text-subtle-foreground">{label}</span>
      <span className="text-title font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  )
}
