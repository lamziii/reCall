import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const statusBadgeVariants = cva('inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-active px-2 py-0.5 text-caption font-medium text-foreground', {
  variants: {
    tone: {
      neutral: '',
      info: '',
      success: '',
      warning: '',
      danger: '',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export type StatusTone = NonNullable<VariantProps<typeof statusBadgeVariants>['tone']>

const DOT_COLOR: Record<StatusTone, string> = {
  neutral: 'bg-subtle-foreground',
  info: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  label: string
  className?: string
}

/** Tone-coded status pill with a leading dot. Tone is semantic (neutral/info/success/warning/danger) — map product statuses to it, don't hardcode product vocabulary here. */
export function StatusBadge({ tone = 'neutral', label, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)}>
      <span className={cn('size-1.5 rounded-full', DOT_COLOR[tone ?? 'neutral'])} />
      {label}
    </span>
  )
}
