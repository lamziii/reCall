import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TagProps {
  children: ReactNode
  onRemove?: () => void
  className?: string
}

/**
 * Chip/Tag: a removable label, distinct from Badge (status/meta, non-interactive). The label is
 * capped and truncates so a long user-created tag can't stretch the layout; the remove control
 * stays a fixed size. Override the cap per-usage via `className` (e.g. `max-w-none`).
 */
export function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span className={cn('inline-flex max-w-[200px] items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-small text-foreground', className)}>
      <span className="min-w-0 truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="focus-ring shrink-0 rounded text-subtle-foreground transition-fast hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}

export { Tag as Chip }
export type { TagProps as ChipProps }
