import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva('flex gap-3 rounded-lg border p-4', {
  variants: {
    variant: {
      neutral: 'border-border bg-surface',
      info: 'border-border-accent bg-accent-muted',
      success: 'border-success/30 bg-success-muted',
      warning: 'border-warning/30 bg-warning-muted',
      danger: 'border-danger/30 bg-danger-muted',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

const ICONS = { neutral: Info, info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle } as const
const ICON_COLOR = {
  neutral: 'text-subtle-foreground',
  info: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  onDismiss?: () => void
  action?: ReactNode
  secondaryAction?: ReactNode
  className?: string
}

export function Alert({ variant = 'neutral', title, description, icon, onDismiss, action, secondaryAction, className }: AlertProps) {
  const tone = variant ?? 'neutral'
  const Icon = ICONS[tone]

  return (
    <div role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} className={cn(alertVariants({ variant }), className)}>
      <span className={cn('mt-0.5 shrink-0 [&>svg]:size-4', ICON_COLOR[tone])}>{icon ?? <Icon className="size-4" />}</span>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-small font-medium text-foreground">{title}</p>
        {description && <p className="text-small text-muted-foreground">{description}</p>}
        {(action || secondaryAction) && (
          <div className="mt-1.5 flex gap-2">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="focus-ring shrink-0 rounded p-0.5 text-subtle-foreground transition-fast hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
