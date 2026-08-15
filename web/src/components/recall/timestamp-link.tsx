import { cn } from '@/lib/utils'

export interface TimestampLinkProps {
  time: string
  active?: boolean
  onClick?: () => void
  className?: string
}

/** Jumps playback to `time` — active means "currently playing at/near this mark". */
export function TimestampLink({ time, active, onClick, className }: TimestampLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'time' : undefined}
      className={cn(
        'focus-ring inline-flex items-center rounded px-1 font-mono text-caption tabular-nums transition-fast',
        active ? 'bg-accent-muted text-accent' : 'text-subtle-foreground hover:bg-accent-muted hover:text-accent',
        className,
      )}
    >
      {time}
    </button>
  )
}
