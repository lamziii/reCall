import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Minus } from '@/components/icons'
import { cn, mergeRefs } from '@/lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  description?: string
  indeterminate?: boolean
}

/** Native checkbox input, visually hidden, driving a styled sibling box via peer-* variants. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, indeterminate = false, className, id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId

    return (
      <label
        htmlFor={inputId}
        className={cn('inline-flex cursor-pointer items-start gap-2.5', props.disabled && 'cursor-not-allowed opacity-40', className)}
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <input
            ref={mergeRefs(ref, (el: HTMLInputElement | null) => {
              if (el) el.indeterminate = indeterminate
            })}
            id={inputId}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'flex size-4 items-center justify-center rounded border border-border-strong bg-surface transition-fast',
              'peer-checked:border-accent peer-checked:bg-accent peer-indeterminate:border-accent peer-indeterminate:bg-accent',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring/40',
            )}
          >
            {/* Stroked checkmark that draws itself in on check (transitions.dev checkbox-check).
                Hidden while unchecked/indeterminate via stroke-dashoffset — see t-check-path in keyframes.css. */}
            <svg viewBox="0 0 12 12" fill="none" aria-hidden className="absolute size-3 text-accent-foreground">
              <path
                d="M2.5 6.5 5 9l4.5-5.5"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="t-check-path [.peer:indeterminate~span_&]:hidden"
              />
            </svg>
            <Minus
              className="absolute size-3 text-accent-foreground opacity-0 [.peer:indeterminate~span_&]:opacity-100"
              strokeWidth={3}
            />
          </span>
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
Checkbox.displayName = 'Checkbox'
