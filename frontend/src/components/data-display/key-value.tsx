import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface KeyValueProps {
  label: ReactNode
  value: ReactNode
  variant?: 'inline' | 'stacked' | 'compact'
  className?: string
}

export function KeyValue({ label, value, variant = 'stacked', className }: KeyValueProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-between gap-4 text-small', className)}>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <span className={cn('text-caption text-muted-foreground', className)}>
        {label}: <span className="text-foreground">{value}</span>
      </span>
    )
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-caption text-subtle-foreground">{label}</span>
      <span className="text-small text-foreground">{value}</span>
    </div>
  )
}
