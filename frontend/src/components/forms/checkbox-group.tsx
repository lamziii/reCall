import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxGroupProps {
  children: ReactNode
  orientation?: 'vertical' | 'horizontal'
  error?: string
  className?: string
  label?: string
  /** Use the label for the group's accessible name without rendering it — e.g. when a heading elsewhere already labels the group visually. */
  hideLabel?: boolean
}

export function CheckboxGroup({ children, orientation = 'vertical', error, className, label, hideLabel }: CheckboxGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && !hideLabel && <span className="text-label font-medium text-foreground">{label}</span>}
      <div
        role="group"
        aria-label={label}
        className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap', className)}
      >
        {children}
      </div>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
