import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedControlOption {
  value: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  className?: string
  'aria-label': string
}

/** Compact mutually-exclusive control — roving arrow-key focus, like a native radiogroup. */
export function SegmentedControl({ options, value, onChange, size = 'md', className, 'aria-label': ariaLabel }: SegmentedControlProps) {
  function onKeyDown(event: React.KeyboardEvent) {
    const enabled = options.filter((o) => !o.disabled)
    const index = enabled.findIndex((o) => o.value === value)
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      onChange(enabled[(index + 1) % enabled.length].value)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      onChange(enabled[(index - 1 + enabled.length) % enabled.length].value)
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn('inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'focus-ring flex items-center gap-1.5 rounded-[5px] px-2.5 text-small font-medium transition-fast',
              size === 'sm' ? 'h-6' : 'h-7',
              active ? 'bg-surface-active text-foreground' : 'text-muted-foreground hover:text-foreground',
              option.disabled && 'pointer-events-none opacity-40',
            )}
          >
            {option.icon && <span className="[&>svg]:size-3.5">{option.icon}</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
