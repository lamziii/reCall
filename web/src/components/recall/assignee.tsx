import { User } from 'lucide-react'
import { Avatar } from '@/components/data-display/avatar'
import { cn } from '@/lib/utils'

export interface AssigneeProps {
  name?: string
  avatarSrc?: string
  compact?: boolean
  className?: string
}

export function Assignee({ name, avatarSrc, compact, className }: AssigneeProps) {
  if (!name) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-small text-subtle-foreground', className)}>
        <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-border-strong">
          <User className="size-3" />
        </span>
        {!compact && 'Unassigned'}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-small text-foreground', className)}>
      <Avatar name={name} src={avatarSrc} size="sm" className="size-5 text-[9px]" />
      {!compact && name}
    </span>
  )
}
