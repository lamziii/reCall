import { useEffect, useRef } from 'react'
import { useLocation } from '@/lib/router-compat'

/**
 * Scrolls to the element named by the URL hash whenever it changes — including on first load when
 * arriving from another route (e.g. /plans → /#security). On the very first run we jump instantly:
 * a smooth scroll toward a far, still-settling target gets interrupted mid-flight. In-page hash
 * changes (clicking a nav link while already on the homepage) scroll smoothly. Retries briefly in
 * case the target hasn't painted yet, and honors prefers-reduced-motion.
 */
export function useScrollToHash() {
  const { hash } = useLocation()
  const firstRun = useRef(true)

  useEffect(() => {
    const initial = firstRun.current
    firstRun.current = false
    if (!hash) return

    const id = decodeURIComponent(hash.slice(1))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let tries = 0
    let timer: ReturnType<typeof setTimeout>

    const go = () => {
      const el = document.getElementById(id)
      if (!el) {
        if (tries++ < 12) timer = setTimeout(go, 50)
        return
      }
      if (initial || reduce) {
        // Deep-link / reduced-motion: land instantly. The global `scroll-behavior: smooth` would
        // otherwise animate even an `auto` scrollIntoView, so pin it off for this one jump.
        const html = document.documentElement
        const prev = html.style.scrollBehavior
        html.style.scrollBehavior = 'auto'
        el.scrollIntoView({ block: 'start' })
        html.style.scrollBehavior = prev
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    timer = setTimeout(go, initial ? 60 : 0)
    return () => clearTimeout(timer)
  }, [hash])
}
