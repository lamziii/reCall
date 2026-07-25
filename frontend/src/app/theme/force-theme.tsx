import type { ReactNode } from 'react'
import type { ResolvedTheme } from './theme-provider'

/**
 * Pins a subtree to a theme regardless of the user's global preference — `data-theme` is a
 * plain attribute selector in colors.css (not :root-anchored), so it cascades correctly from
 * any nesting depth. `display: contents` keeps the wrapper out of layout entirely.
 */
export function ForceTheme({ theme, children }: { theme: ResolvedTheme; children: ReactNode }) {
  return (
    <div data-theme={theme} className="contents">
      {children}
    </div>
  )
}
