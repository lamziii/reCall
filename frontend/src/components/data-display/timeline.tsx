import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col', className)}>{children}</div>
}

export interface TimelineItemProps {
  time: ReactNode
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  isLast?: boolean
}

export function TimelineItem({ time, title, description, icon, isLast }: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-subtle-foreground [&>svg]:size-3.5">
          {icon ?? <span className="size-1.5 rounded-full bg-accent" />}
        </span>
        {!isLast && <span className="w-px flex-1 bg-border-subtle" />}
      </div>
      <div className={cn('flex flex-col gap-0.5', !isLast && 'pb-6')}>
        <span className="text-caption text-subtle-foreground">{time}</span>
        <span className="text-small font-medium text-foreground">{title}</span>
        {description && <span className="text-small text-muted-foreground">{description}</span>}
      </div>
    </div>
  )
}
