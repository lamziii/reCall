import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  label?: ReactNode
  className?: string
}

export function Divider({ orientation = 'horizontal', label, className }: DividerProps) {
  if (orientation === 'vertical') {
    return <div role="separator" aria-orientation="vertical" className={cn('h-full w-px bg-border', className)} />
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div role="separator" className="h-px flex-1 bg-border" />
        <span className="text-caption text-subtle-foreground">{label}</span>
        <div role="separator" className="h-px flex-1 bg-border" />
      </div>
    )
  }

  return <div role="separator" aria-orientation="horizontal" className={cn('h-px w-full bg-border', className)} />
}
