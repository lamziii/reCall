import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

/** Vertical rhythm block — whitespace defines the section, per the design principles, not a border. */
export function Section({ title, description, actions, className, children, ...props }: SectionProps) {
  return (
    <section className={cn('flex flex-col gap-4 py-8', className)} {...props}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-h3 font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-small text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
