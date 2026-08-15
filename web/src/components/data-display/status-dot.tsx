import { cn } from '@/lib/utils'

export type StatusDotState = 'neutral' | 'active' | 'success' | 'warning' | 'danger' | 'processing' | 'offline'

const COLOR: Record<StatusDotState, string> = {
  neutral: 'bg-subtle-foreground',
  active: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  processing: 'bg-accent',
  offline: 'bg-disabled-foreground',
}

const PULSE: ReadonlySet<StatusDotState> = new Set(['active', 'processing'])

export interface StatusDotProps {
  state: StatusDotState
  label?: string
  className?: string
}

/** A single-color dot for the smallest possible state indication — inline in table rows, list items, avatars. */
export function StatusDot({ state, label, className }: StatusDotProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cn('relative inline-flex size-2 shrink-0', className)}
    >
      {PULSE.has(state) && (
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-40', COLOR[state])} />
      )}
      <span className={cn('relative inline-flex size-2 rounded-full', COLOR[state])} />
    </span>
  )
}
