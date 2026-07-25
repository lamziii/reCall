import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { NavLink as RouterNavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface NavLinkProps {
  to: string
  children: ReactNode
  className?: string
  end?: boolean
}

/** Route-aware link — applies active styling automatically via react-router's isActive match. */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, children, className, end }, ref) => {
  return (
    <RouterNavLink
      ref={ref}
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'focus-ring rounded-sm text-small font-medium transition-fast',
          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          className,
        )
      }
    >
      {children}
    </RouterNavLink>
  )
})
NavLink.displayName = 'NavLink'
