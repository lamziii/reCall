import { cn } from '@/lib/utils'

export interface ProgressProps {
  value?: number
  className?: string
  indeterminate?: boolean
  label?: string
}

export function Progress({ value = 0, className, indeterminate = false, label = 'Progress' }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-active', className)}
    >
      <div
        className={cn(
          'h-full rounded-full bg-accent transition-base',
          indeterminate && 'w-1/3 animate-[progress-indeterminate_1.2s_ease-in-out_infinite]',
        )}
        style={indeterminate ? undefined : { width: `${clamped}%` }}
      />
    </div>
  )
}
