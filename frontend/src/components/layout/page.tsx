import type { HTMLAttributes, ReactNode } from 'react'
import { Container } from './container'
import { cn } from '@/lib/utils'

export function Page({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Container width="page" className={cn('flex flex-col py-8', className)} {...props} />
}

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumb?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 pb-6', className)}>
      {breadcrumb}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h2 font-semibold text-foreground">{title}</h1>
          {description && <p className="text-small text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
