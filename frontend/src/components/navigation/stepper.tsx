import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepStatus = 'completed' | 'current' | 'pending' | 'error'

export interface StepperStep {
  id: string
  label: string
  description?: string
  status?: StepStatus
}

export interface StepperProps {
  steps: StepperStep[]
  orientation?: 'horizontal' | 'vertical'
  /** Hide the label/description text and render circles + connectors only. Defaults to true. */
  showLabels?: boolean
  /** Circle diameter. 'lg' for contexts where the indicator should read as a bigger, calmer focal point. */
  size?: 'md' | 'lg'
  className?: string
}

const CIRCLE_SIZE = { md: 'size-6 text-caption', lg: 'size-8 text-small' }
const CIRCLE_ICON_SIZE = { md: 'size-3.5', lg: 'size-4' }

export function Stepper({ steps, orientation = 'horizontal', showLabels = true, size = 'md', className }: StepperProps) {
  const isRow = orientation === 'horizontal'

  return (
    <ol className={cn('flex', isRow ? 'flex-row items-start' : 'flex-col', className)}>
      {steps.map((step, index) => {
        const status = step.status ?? 'pending'
        const isLast = index === steps.length - 1

        return (
          <li key={step.id} className={cn('flex', isRow ? 'flex-1 flex-col items-start' : 'flex-row gap-3')}>
            <div className={cn('flex items-center', isRow ? 'w-full' : 'flex-col')}>
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full border font-medium transition-base',
                  CIRCLE_SIZE[size],
                  status === 'completed' && 'border-accent bg-accent text-accent-foreground',
                  status === 'current' && 'border-accent text-accent',
                  status === 'pending' && 'border-border text-subtle-foreground',
                  status === 'error' && 'border-danger text-danger',
                )}
              >
                {status === 'completed' ? (
                  <Check className={CIRCLE_ICON_SIZE[size]} />
                ) : status === 'error' ? (
                  <X className={CIRCLE_ICON_SIZE[size]} />
                ) : (
                  index + 1
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    isRow ? 'mx-2 h-px flex-1' : 'my-2 w-px flex-1',
                    'transition-base',
                    status === 'completed' ? 'bg-accent' : 'bg-border',
                  )}
                />
              )}
            </div>
            <div className={cn('flex flex-col', showLabels && (isRow ? 'mt-2' : 'pb-6'))}>
              <span
                className={cn(
                  'text-small font-medium',
                  status === 'pending' ? 'text-subtle-foreground' : 'text-foreground',
                  !showLabels && 'sr-only',
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className={cn('text-caption text-muted-foreground', !showLabels && 'sr-only')}>{step.description}</span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
