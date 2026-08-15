import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMediaQuery } from '@/hooks'

// 'midnight' is a near-black (OLED) variant of dark — it resolves to the dark palette plus a
// data-midnight flag that deepens the background. Kept in this same provider so there is ONE theme
// source of truth (localStorage `recall-theme`), applied before first paint by index.html.
export type ThemePreference = 'light' | 'dark' | 'system' | 'midnight'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  /** What the user actually chose — including "system". This is what UI (toggle, settings) should reflect. */
  preference: ThemePreference
  /** What's actually applied to the page right now — always light or dark, never "system". */
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

export const STORAGE_KEY = 'recall-theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'midnight' ? stored : 'system'
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme() must be used inside <ThemeProvider>')
  return ctx
}

/**
 * Owns the app-wide light/dark/system preference: persists it, resolves "system" against
 * the OS media query live, and reflects the result onto <html data-theme>, which is what
 * every semantic color token (bg-surface, text-foreground, ...) actually keys off of. Mount
 * once near the app root — the blocking script in index.html applies the same resolution
 * before first paint so there's no flash while this provider spins up.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  const resolvedTheme: ResolvedTheme =
    preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference === 'midnight' ? 'dark' : preference
  const isMidnight = preference === 'midnight'

  // Layout effect, not a plain effect: applies before the browser paints, so a preference
  // change (or the system theme flipping) never shows a stale frame first.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    if (isMidnight) document.documentElement.setAttribute('data-midnight', 'true')
    else document.documentElement.removeAttribute('data-midnight')
  }, [resolvedTheme, isMidnight])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, preference)
  }, [preference])

  // Gate the color-transition CSS behind one animation frame so the very first
  // (already-correct, pre-painted) theme never visibly "transitions in".
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme-ready', '')
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, setPreference: setPreferenceState }),
    [preference, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
