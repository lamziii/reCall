import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/feedback/spinner'

export const buttonVariants = cva(
  'focus-ring transition-fast inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active',
        secondary: 'border border-border bg-surface-raised text-foreground hover:bg-surface-hover active:bg-surface-active',
        ghost: 'text-foreground hover:bg-surface-hover active:bg-surface-active',
        outline: 'border border-border-strong bg-transparent text-foreground hover:bg-surface-hover active:bg-surface-active',
        danger: 'bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger',
        link: 'text-accent underline-offset-4 hover:underline p-0 h-auto',
        text: 'text-muted-foreground hover:text-foreground p-0 h-auto',
      },
      size: {
        xs: 'h-6 px-2 text-caption gap-1.5',
        sm: 'h-7 px-2.5 text-small',
        md: 'h-9 px-3.5 text-small',
        lg: 'h-10 px-5 text-body',
        'icon-xs': 'size-6',
        'icon-sm': 'size-7',
        'icon-md': 'size-9',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size = 'md', loading, disabled, leftIcon, rightIcon, fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', '[&_svg]:size-4 [&_svg]:shrink-0', className)}
        {...props}
      >
        {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} label="" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  },
)
Button.displayName = 'Button'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onKeyDown'>, Omit<VariantProps<typeof buttonVariants>, 'size'> {
  icon: ReactNode
  label: string
  loading?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

/** Icon-only button. `label` is required — it becomes the accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = 'ghost', size = 'md', loading, disabled, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(buttonVariants({ variant, size: `icon-${size}` }), '[&_svg]:size-4 [&_svg]:shrink-0', className)}
        {...props}
      >
        {loading ? <Spinner size="sm" label="" /> : icon}
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
