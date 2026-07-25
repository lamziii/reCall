import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface MetadataRowProps {
  icon?: ReactNode
  label: string
  value: ReactNode
  action?: ReactNode
  wrap?: boolean
  className?: string
}

export function MetadataRow({ icon, label, value, action, wrap, className }: MetadataRowProps) {
  return (
    <div className={cn('flex items-center gap-2 text-small', wrap && 'flex-wrap', className)}>
      {icon && <span className="shrink-0 text-subtle-foreground [&>svg]:size-4">{icon}</span>}
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={cn('min-w-0 flex-1 text-foreground', !wrap && 'truncate')}>{value}</span>
      {action}
    </div>
  )
}
