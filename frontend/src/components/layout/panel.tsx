import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  actions?: ReactNode
}

/** Bordered content region with an optional title bar — sidebars, inspector panes, filter drawers. */
export function Panel({ title, actions, className, children, ...props }: PanelProps) {
  return (
    <div className={cn('flex h-full flex-col border-border bg-surface', className)} {...props}>
      {(title || actions) && (
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
          {title && <span className="text-small font-medium text-foreground">{title}</span>}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  )
}
