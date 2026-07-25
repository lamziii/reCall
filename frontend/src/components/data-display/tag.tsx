import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TagProps {
  children: ReactNode
  onRemove?: () => void
  className?: string
}

/** Chip/Tag: a removable label, distinct from Badge (status/meta, non-interactive). */
export function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-small text-foreground', className)}>
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="focus-ring rounded text-subtle-foreground transition-fast hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

export { Tag as Chip }
export type { TagProps as ChipProps }
