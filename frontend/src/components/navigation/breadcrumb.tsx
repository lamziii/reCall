import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-small', className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <a href={item.href} className="focus-ring rounded text-muted-foreground transition-fast hover:text-foreground">
                  {item.label}
                </a>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="size-3.5 text-subtle-foreground" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
