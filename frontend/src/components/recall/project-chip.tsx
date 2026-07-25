import type { ReactNode } from 'react'
import { FolderKanban, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProjectChipProps {
  name: string
  icon?: ReactNode
  removable?: boolean
  onRemove?: () => void
  onClick?: () => void
  selected?: boolean
  className?: string
}

export function ProjectChip({ name, icon, removable, onRemove, onClick, selected, className }: ProjectChipProps) {
  const interactive = Boolean(onClick)

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      aria-pressed={interactive ? selected : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-small text-foreground',
        interactive && 'focus-ring cursor-pointer transition-fast hover:bg-surface-hover',
        selected && 'border-border-accent bg-surface-selected',
        className,
      )}
    >
      <span className="text-subtle-foreground [&>svg]:size-3.5">{icon ?? <FolderKanban className="size-3.5" />}</span>
      {name}
      {removable && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={(event) => {
            event.stopPropagation()
            onRemove?.()
          }}
          className="focus-ring ml-0.5 rounded text-subtle-foreground transition-fast hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
