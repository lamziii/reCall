import { createContext, forwardRef, useContext } from 'react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { NavLink as RouterNavLink } from 'react-router-dom'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const SidebarCollapsedContext = createContext(false)

/** Whether the nearest ancestor <Sidebar> is in its collapsed (icon-only) state. */
export function useSidebarCollapsed() {
  return useContext(SidebarCollapsedContext)
}

/** Icon size for sidebar nav rows — ~7% up from the type scale's default size-4 (16px). */
export const SIDEBAR_ICON_CLASS = 'shrink-0 [&>svg]:size-[17px]'

/** Shared visual treatment for anything that looks like a nav row — real links (SidebarItem) and action triggers (SidebarButtonItem) alike. */
export function sidebarItemClass(collapsed: boolean, active: boolean, className?: string) {
  return cn(
    'focus-ring relative flex w-full items-center gap-[0.67rem] rounded-[10px] py-[0.4rem] text-[0.875rem] font-medium transition-fast',
    collapsed ? 'justify-center px-0' : 'px-[0.67rem]',
    active
      ? 'bg-surface-selected text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent'
      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
    className,
  )
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false, className, children, ...props }: SidebarProps) {
  return (
    <SidebarCollapsedContext.Provider value={collapsed}>
      <aside
        style={{ width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)' }}
        className={cn('flex h-full min-h-0 flex-col bg-surface transition-[width] transition-base', className)}
        {...props}
      >
        {children}
      </aside>
    </SidebarCollapsedContext.Provider>
  )
}

export function SidebarHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-[var(--header-height)] shrink-0 items-center gap-2 px-3', className)} {...props} />
}

export function SidebarFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto flex shrink-0 flex-col gap-0.5 px-2 py-3', className)} {...props} />
}

export function SidebarSection({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  const collapsed = useContext(SidebarCollapsedContext)

  return (
    <div className={cn('flex flex-col gap-0.5 px-2 py-2', className)}>
      {label && !collapsed && (
        <div className="px-2.5 pb-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground">{label}</div>
      )}
      {label && collapsed && <div className="mx-2.5 mb-2 h-px bg-border-subtle" />}
      {children}
    </div>
  )
}

export interface SidebarItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: ReactNode
  active?: boolean
  trailing?: ReactNode
  /** In-app route — renders react-router's NavLink and computes `active` from the current location. */
  to?: string
  end?: boolean
}

export function SidebarItem({ icon, active, trailing, to, end, className, children, href, ...props }: SidebarItemProps) {
  const collapsed = useContext(SidebarCollapsedContext)

  const content = (
    <>
      {icon && <span className={SIDEBAR_ICON_CLASS}>{icon}</span>}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {trailing}
        </>
      )}
    </>
  )

  const link = to ? (
    <RouterNavLink to={to} end={end} className={({ isActive }) => sidebarItemClass(collapsed, isActive, className)} {...props}>
      {content}
    </RouterNavLink>
  ) : (
    <a href={href} aria-current={active ? 'page' : undefined} className={sidebarItemClass(collapsed, !!active, className)} {...props}>
      {content}
    </a>
  )

  if (!collapsed || !children) return link

  return (
    <Tooltip content={children} placement="right">
      {link}
    </Tooltip>
  )
}

export interface SidebarButtonItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  trailing?: ReactNode
}

/** Same look as SidebarItem, but a <button> — for rows that open a menu/popover instead of navigating (Notifications, Help, Profile). */
export const SidebarButtonItem = forwardRef<HTMLButtonElement, SidebarButtonItemProps>(
  ({ icon, trailing, className, children, ...props }, ref) => {
    const collapsed = useContext(SidebarCollapsedContext)

    const button = (
      <button ref={ref} type="button" className={sidebarItemClass(collapsed, false, className)} {...props}>
        {icon && <span className={SIDEBAR_ICON_CLASS}>{icon}</span>}
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{children}</span>
            {trailing}
          </>
        )}
      </button>
    )

    if (!collapsed || !children) return button

    return (
      <Tooltip content={children} placement="right">
        {button}
      </Tooltip>
    )
  },
)
SidebarButtonItem.displayName = 'SidebarButtonItem'
