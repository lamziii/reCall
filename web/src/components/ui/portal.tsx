'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState, type ReactNode } from 'react'

let overlayRoot: HTMLElement | null = null

function getOverlayRoot() {
  if (overlayRoot) return overlayRoot
  overlayRoot = document.getElementById('overlay-root')
  if (!overlayRoot) {
    overlayRoot = document.createElement('div')
    overlayRoot.id = 'overlay-root'
    document.body.appendChild(overlayRoot)
  }
  return overlayRoot
}

/**
 * Renders children into a single shared overlay root at the end of `<body>`. SSR-safe: portals need
 * `document`, so nothing renders on the server or the first client paint — it mounts after hydration.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, getOverlayRoot())
}
