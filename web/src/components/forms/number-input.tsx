import { ChevronDown, ChevronUp } from 'lucide-react'
import { inputVariants } from './input'
import { cn } from '@/lib/utils'

export interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

function clamp(value: number, min?: number, max?: number) {
  let next = value
  if (min !== undefined) next = Math.max(min, next)
  if (max !== undefined) next = Math.min(max, next)
  return next
}

/** Number field with increment/decrement steppers. Not a spreadsheet control — just min/max/step. */
export function NumberInput({ value, onChange, min, max, step = 1, disabled, size = 'md', className, id, ...aria }: NumberInputProps) {
  return (
    <div className={cn(inputVariants({ size }), 'items-center gap-1 pr-1', className)}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (!Number.isNaN(next)) onChange(clamp(next, min, max))
        }}
        className="h-full w-full min-w-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        {...aria}
      />
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          aria-label="Increment"
          disabled={disabled || (max !== undefined && value >= max)}
          onClick={() => onChange(clamp(value + step, min, max))}
          className="flex h-3.5 items-center justify-center rounded-sm text-subtle-foreground transition-fast hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          aria-label="Decrement"
          disabled={disabled || (min !== undefined && value <= min)}
          onClick={() => onChange(clamp(value - step, min, max))}
          className="flex h-3.5 items-center justify-center rounded-sm text-subtle-foreground transition-fast hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  )
}
