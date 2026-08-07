import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ResolvedTheme } from './theme-provider'

/**
 * Pins a subtree to a theme regardless of the user's global preference — `data-theme` is a
 * plain attribute selector in colors.css (not :root-anchored), so it cascades correctly from
 * any nesting depth. `display: contents` keeps the wrapper out of layout entirely.
 *
 * `syncDocument` also pins `<html>` to the theme while mounted (restored on unmount), so the
 * overscroll/rubber-band area — which paints the html background, outside this subtree —
 * matches the forced theme instead of flashing the user's global (possibly light) background.
 */
export function ForceTheme({
  theme,
  syncDocument,
  children,
}: {
  theme: ResolvedTheme
  syncDocument?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    if (!syncDocument) return
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', theme)
    return () => {
      if (prev) el.setAttribute('data-theme', prev)
    }
  }, [theme, syncDocument])

  return (
    <div data-theme={theme} className="contents">
      {children}
    </div>
  )
}
