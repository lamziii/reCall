import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
}

export function Header({ left, center, right, className, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn('flex h-[var(--header-height)] shrink-0 items-center gap-4 border-b border-border bg-surface px-4', className)}
      {...props}
    >
      {left && <div className="flex items-center gap-2">{left}</div>}
      {center && <div className="flex flex-1 items-center justify-center">{center}</div>}
      {!center && <div className="flex-1" />}
      {right && <div className="flex items-center gap-2">{right}</div>}
      {children}
    </header>
  )
}
