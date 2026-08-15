import { X } from 'lucide-react'
import { Avatar } from './avatar'
import { cn } from '@/lib/utils'

export interface PersonChipProps {
  name: string
  role?: string
  avatarSrc?: string
  removable?: boolean
  onRemove?: () => void
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  className?: string
}

/** Not a nested <button> even when both clickable and removable — that'd be invalid HTML, so the container is a div with role="button". */
export function PersonChip({ name, role, avatarSrc, removable, onRemove, onClick, selected, disabled, className }: PersonChipProps) {
  const interactive = Boolean(onClick) && !disabled

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
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
        'inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-small',
        interactive && 'focus-ring cursor-pointer transition-fast hover:bg-surface-hover',
        selected && 'border-border-accent bg-surface-selected',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <Avatar name={name} src={avatarSrc} size="sm" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-foreground">{name}</span>
        {role && <span className="text-caption text-subtle-foreground">{role}</span>}
      </span>
      {removable && (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={(event) => {
            event.stopPropagation()
            onRemove?.()
          }}
          className="focus-ring ml-1 rounded text-subtle-foreground transition-fast hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
