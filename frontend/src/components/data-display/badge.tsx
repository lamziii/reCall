import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva('inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-medium', {
  variants: {
    variant: {
      default: 'bg-surface-active text-foreground',
      accent: 'bg-accent-muted text-accent',
      success: 'bg-success-muted text-success',
      danger: 'bg-danger-muted text-danger',
      warning: 'bg-warning-muted text-warning',
      outline: 'border border-border text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function Badge({ variant, children, icon, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {icon && <span className="[&>svg]:size-3">{icon}</span>}
      {children}
    </span>
  )
}
