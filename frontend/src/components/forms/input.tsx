import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const inputVariants = cva(
  'flex w-full min-w-0 rounded-md border bg-surface text-foreground placeholder:text-subtle-foreground transition-fast outline-none disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-small',
        md: 'h-9 px-3 text-small',
        lg: 'h-10 px-3.5 text-body',
      },
      state: {
        default: 'border-border focus:border-border-accent focus:ring-2 focus:ring-focus-ring/40',
        error: 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30',
      },
    },
    defaultVariants: { size: 'md', state: 'default' },
  },
)

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, state, error, leftIcon, rightIcon, ...props }, ref) => {
    if (!leftIcon && !rightIcon) {
      return (
        <input
          ref={ref}
          className={cn(inputVariants({ size, state: error ? 'error' : state }), className)}
          aria-invalid={error}
          {...props}
        />
      )
    }

    return (
      <div
        className={cn(
          inputVariants({ size, state: error ? 'error' : state }),
          'items-center gap-2 px-2.5 has-[input:focus]:border-border-accent has-[input:focus]:ring-2 has-[input:focus]:ring-focus-ring/40',
          className,
        )}
      >
        {leftIcon && <span className="flex shrink-0 items-center text-subtle-foreground [&>svg]:size-4">{leftIcon}</span>}
        <input
          ref={ref}
          className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-subtle-foreground"
          aria-invalid={error}
          {...props}
        />
        {rightIcon && <span className="flex shrink-0 items-center text-subtle-foreground [&>svg]:size-4">{rightIcon}</span>}
      </div>
    )
  },
)
Input.displayName = 'Input'
