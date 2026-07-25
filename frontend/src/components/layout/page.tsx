import type { HTMLAttributes, ReactNode } from 'react'
import { Container } from './container'
import { cn } from '@/lib/utils'

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Container width="wide" className={cn('flex h-full flex-1 flex-col py-10', className)} {...props} />
}

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumb?: ReactNode
  /** Optional row of filters/view controls, rendered below the title block. */
  toolbar?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, breadcrumb, toolbar, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-5 pb-8', className)}>
      <div className="flex flex-col gap-3">
        {breadcrumb}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-h2 font-semibold text-foreground">{title}</h1>
            {description && <p className="text-small text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </div>
      {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
    </div>
  )
}
