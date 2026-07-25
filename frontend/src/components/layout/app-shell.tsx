import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface AppShellProps {
  sidebar: ReactNode
  header?: ReactNode
  children: ReactNode
  className?: string
}

/** Root workspace grid: sidebar spans full height, header sits above scrollable content. */
export function AppShell({ sidebar, header, children, className }: AppShellProps) {
  return (
    <div className={cn('grid h-dvh grid-cols-[auto_1fr] grid-rows-[auto_1fr]', className)}>
      <div className="row-span-2">{sidebar}</div>
      {header}
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
