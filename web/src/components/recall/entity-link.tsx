import type { ReactNode } from 'react'
import { MENTION_ICONS, type MentionType } from './mention'
import { cn } from '@/lib/utils'

export interface EntityLinkProps {
  type: MentionType
  children: ReactNode
  onClick?: () => void
  className?: string
}

/** Plain inline reference for prose — "related to EntityLink" — vs. Mention's pill chip. */
export function EntityLink({ type, children, onClick, className }: EntityLinkProps) {
  const Icon = MENTION_ICONS[type]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex items-center gap-1 rounded-sm text-foreground underline decoration-border-strong underline-offset-4 transition-fast hover:text-accent hover:decoration-accent',
        className,
      )}
    >
      <Icon className="size-3 text-subtle-foreground" />
      {children}
    </button>
  )
}
