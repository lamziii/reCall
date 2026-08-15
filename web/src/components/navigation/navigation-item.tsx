import type { ReactNode } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface NavigationItemProps {
  icon?: ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  badge?: ReactNode
  count?: number
  collapsed?: boolean
  href?: string
  onClick?: () => void
  className?: string
}

/** General-purpose nav row — icon, label, active/disabled state, badge or count, and a collapsed icon-only mode with a tooltip. */
export function NavigationItem({ icon, label, active, disabled, badge, count, collapsed, href, onClick, className }: NavigationItemProps) {
  const content = (
    <>
      {icon && <span className="shrink-0 [&>svg]:size-4">{icon}</span>}
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && badge}
      {!collapsed && count !== undefined && <span className="text-caption tabular-nums text-subtle-foreground">{count}</span>}
    </>
  )

  const classes = cn(
    'focus-ring flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-small font-medium transition-fast',
    collapsed && 'justify-center',
    active ? 'bg-surface-selected text-foreground' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
    disabled && 'pointer-events-none opacity-40',
    className,
  )

  const element = href ? (
    <a href={href} aria-current={active ? 'page' : undefined} aria-disabled={disabled} className={classes}>
      {content}
    </a>
  ) : (
    <button type="button" aria-current={active ? 'page' : undefined} disabled={disabled} onClick={onClick} className={classes}>
      {content}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip content={label} placement="right">
        {element}
      </Tooltip>
    )
  }

  return element
}
