import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

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

/** Renders children into a single shared overlay root at the end of `<body>`. */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, getOverlayRoot())
}
