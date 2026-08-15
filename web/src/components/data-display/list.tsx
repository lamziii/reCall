import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function List({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('flex flex-col divide-y divide-border-subtle', className)} {...props} />
}

export interface ListItemProps extends LiHTMLAttributes<HTMLLIElement> {
  leading?: ReactNode
  trailing?: ReactNode
  selected?: boolean
  interactive?: boolean
}

export function ListItem({ leading, trailing, selected, interactive, className, children, ...props }: ListItemProps) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-small text-foreground',
        interactive && 'cursor-pointer transition-fast hover:bg-surface-hover',
        selected && 'bg-surface-selected',
        className,
      )}
      {...props}
    >
      {leading && <span className="flex shrink-0 items-center [&>svg]:size-4 [&>svg]:text-subtle-foreground">{leading}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
    </li>
  )
}
