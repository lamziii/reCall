import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  description?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId

    return (
      <label
        htmlFor={inputId}
        className={cn('inline-flex cursor-pointer items-start gap-2.5', props.disabled && 'cursor-not-allowed opacity-40', className)}
      >
        <span className="relative inline-flex shrink-0 items-center">
          <input ref={ref} id={inputId} type="checkbox" role="switch" className="peer sr-only" {...props} />
          <span
            className={cn(
              'h-5 w-9 rounded-full bg-surface-active transition-fast',
              'peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg',
            )}
          />
          <span className="pointer-events-none absolute left-0.5 size-4 rounded-full bg-neutral-50 shadow-sm transition-fast peer-checked:translate-x-4" />
        </span>
        {(label || description) && (
          <span className="flex flex-col gap-0.5 text-small text-foreground">
            {label}
            {description && <span className="text-caption text-muted-foreground">{description}</span>}
          </span>
        )}
      </label>
    )
  },
)
Switch.displayName = 'Switch'
