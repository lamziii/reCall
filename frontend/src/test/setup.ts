import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// jsdom has no Clipboard API. Define it once, stably, so tests can
// `vi.spyOn(navigator.clipboard, 'writeText')` instead of replacing the
// object (replacing it mid-test loses the reference across the async gap
// user-event's click dispatch introduces).
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  })
}

// jsdom doesn't implement matchMedia — components (useMediaQuery, reduced-motion) need it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}

// jsdom doesn't implement <dialog>'s showModal()/close() — Dialog/Drawer/Sheet/CommandMenu
// all rely on them. Minimal polyfill: open attribute, focus save/restore, Escape -> cancel event.
interface PolyfilledDialog extends HTMLDialogElement {
  _previousActiveElement?: HTMLElement | null
  _escapeHandler?: (event: KeyboardEvent) => void
}

if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: PolyfilledDialog) {
    this.setAttribute('open', '')
    this._previousActiveElement = document.activeElement as HTMLElement | null
    this.focus()
    this._escapeHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const notPrevented = this.dispatchEvent(new Event('cancel', { cancelable: true }))
      if (notPrevented) this.close()
    }
    document.addEventListener('keydown', this._escapeHandler)
  }

  HTMLDialogElement.prototype.close = function (this: PolyfilledDialog) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    if (this._escapeHandler) document.removeEventListener('keydown', this._escapeHandler)
    this.dispatchEvent(new Event('close'))
    this._previousActiveElement?.focus()
  }

  Object.defineProperty(HTMLDialogElement.prototype, 'open', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open')
    },
    set(this: HTMLDialogElement, value: boolean) {
      if (value) this.setAttribute('open', '')
      else this.removeAttribute('open')
    },
  })
}
