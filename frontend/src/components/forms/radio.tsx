import { createContext, forwardRef, useContext, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const RadioGroupContext = createContext<{ name: string } | null>(null)

export function RadioGroup({ name, className, children }: { name: string; className?: string; children: ReactNode }) {
  return (
    <RadioGroupContext.Provider value={{ name }}>
      <div role="radiogroup" className={cn('flex flex-col gap-2.5', className)}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  description?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, name, ...props }, ref) => {
    const group = useContext(RadioGroupContext)
    const autoId = useId()
    const inputId = id ?? autoId

    return (
      <label
        htmlFor={inputId}
        className={cn('inline-flex cursor-pointer items-start gap-2.5', props.disabled && 'cursor-not-allowed opacity-40', className)}
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <input ref={ref} id={inputId} type="radio" name={name ?? group?.name} className="peer sr-only" {...props} />
          <span
            className={cn(
              'flex size-4 items-center justify-center rounded-full border border-border-strong bg-surface transition-fast',
              'peer-checked:border-accent',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring/40',
            )}
          >
            <span className="size-1.5 scale-0 rounded-full bg-accent transition-fast [.peer:checked~span_&]:scale-100" />
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
Radio.displayName = 'Radio'
