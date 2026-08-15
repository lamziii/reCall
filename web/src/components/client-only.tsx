'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Renders children only after client mount. During SSR/prerender it renders `fallback` (default:
 * nothing), so the page subtree never runs on the server.
 *
 * MIGRATION RATIONALE: the Vite app was a pure client SPA — it rendered nothing on the server. To
 * preserve behavior exactly (and avoid SSR-time `window`/`document`/Firebase access across ~500
 * copied files), the root layout wraps all page content in <ClientOnly>. The server still renders
 * <html>/<head> (metadata, the no-flash theme script, global CSS). Re-enabling SSR for specific
 * routes (e.g. marketing SEO) is a deliberate later step, done per-route, not globally.
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return <>{mounted ? children : fallback}</>
}
