import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[]
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: 'h-8 pl-2.5 pr-8 text-small',
  md: 'h-9 pl-3 pr-8 text-small',
  lg: 'h-10 pl-3.5 pr-9 text-body',
}

/** Native <select>, restyled. Free keyboard/mobile/a11y behavior — no listbox to reimplement. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, size = 'md', className, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none rounded-md border border-border bg-surface text-foreground',
            'transition-fast outline-none focus:border-border-accent focus:ring-2 focus:ring-focus-ring/40',
            'disabled:cursor-not-allowed disabled:opacity-40',
            SIZE[size],
            className,
          )}
          defaultValue={props.value === undefined ? (props.defaultValue ?? (placeholder ? '' : undefined)) : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
      </div>
    )
  },
)
Select.displayName = 'Select'
