import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: boolean
}

export function Sidebar({ collapsed, className, children, ...props }: SidebarProps) {
  return (
    <aside
      style={{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
      className={cn('flex h-full min-h-0 flex-col border-r border-border bg-surface transition-[width]', className)}
      {...props}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-[var(--header-height)] shrink-0 items-center gap-2 px-4', className)} {...props} />
}

export function SidebarFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto shrink-0 border-t border-border-subtle p-3', className)} {...props} />
}

export function SidebarSection({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-0.5 px-2 py-2', className)}>
      {label && <div className="px-2 pb-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground">{label}</div>}
      {children}
    </div>
  )
}

export interface SidebarItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: ReactNode
  active?: boolean
  trailing?: ReactNode
}

export function SidebarItem({ icon, active, trailing, className, children, ...props }: SidebarItemProps) {
  return (
    <a
      aria-current={active ? 'page' : undefined}
      className={cn(
        'focus-ring flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-small font-medium transition-fast',
        active ? 'bg-surface-selected text-foreground' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0 [&>svg]:size-4">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </a>
  )
}
