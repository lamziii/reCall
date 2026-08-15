import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}>
      {icon && (
        <div className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-subtle-foreground [&>svg]:size-5">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-title font-medium text-foreground">{title}</p>
        {description && <p className="max-w-sm text-small text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
