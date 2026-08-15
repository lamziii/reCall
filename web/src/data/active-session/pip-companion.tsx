'use client'

/**
 * Document Picture-in-Picture host for the Meeting Companion.
 *
 * The companion is rendered with createPortal into the PiP window's document, but stays inside the
 * MAIN React tree — so it consumes the SAME ActiveSessionProvider (recorder, timer, notes, analyser).
 * The PiP window owns NOTHING: closing it never stops recording; reopening reflects live state. There
 * is only ever one recorder / one session / one notes store.
 *
 * Opens only from an explicit user gesture (Pop Out). Feature-detected; unsupported → open() is a
 * no-op and `supported` is false (the persistent RecordingDock remains the fallback).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useActiveSession } from './active-session-context'
import { MeetingCompanion } from '@/components/recording/meeting-companion'

interface PipCompanionValue {
  supported: boolean
  isOpen: boolean
  open: () => Promise<void>
  close: () => void
}

const PipCompanionContext = createContext<PipCompanionValue | null>(null)

export function usePipCompanion(): PipCompanionValue {
  const ctx = useContext(PipCompanionContext)
  if (!ctx) throw new Error('usePipCompanion() must be used inside <PipCompanionProvider>')
  return ctx
}

const THEME_ATTRS = ['data-theme', 'data-midnight', 'data-accent', 'data-radius', 'data-font', 'data-reduce-motion', 'data-high-contrast', 'data-scrollbars']

/** Copy Recall's stylesheets + theme attributes into the PiP document so tokens/fonts resolve. */
function bridgeStyles(pip: Window): () => void {
  const src = document
  const dst = pip.document

  // Clone every stylesheet node (Turbopack dev = <style>, prod = <link rel=stylesheet>, both same-origin).
  src.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    dst.head.appendChild(node.cloneNode(true))
  })

  // Mirror theme attributes now, and keep them in sync if the user toggles theme while PiP is open.
  const mirror = () => THEME_ATTRS.forEach((a) => {
    const v = src.documentElement.getAttribute(a)
    if (v === null) dst.documentElement.removeAttribute(a)
    else dst.documentElement.setAttribute(a, v)
  })
  mirror()
  const observer = new MutationObserver(mirror)
  observer.observe(src.documentElement, { attributes: true, attributeFilter: THEME_ATTRS })

  dst.documentElement.lang = 'en'
  dst.body.style.margin = '0'
  dst.body.style.background = 'var(--color-bg)'
  dst.body.style.color = 'var(--color-foreground)'
  dst.body.style.fontFamily = 'var(--font-sans)'

  return () => observer.disconnect()
}

export function PipCompanionProvider({ children }: { children: ReactNode }) {
  const supported = typeof window !== 'undefined' && Boolean(window.documentPictureInPicture)
  const session = useActiveSession()
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const pipRef = useRef<Window | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const teardown = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
    pipRef.current = null
    setContainer(null)
  }, [])

  const close = useCallback(() => {
    pipRef.current?.close()
    // 'pagehide' handler runs teardown; call directly too in case the event is missed.
    teardown()
  }, [teardown])

  const open = useCallback(async () => {
    if (!supported) return
    // Never create a second companion for one session — reuse/focus the existing one.
    if (pipRef.current) {
      pipRef.current.focus()
      return
    }
    let pip: Window
    try {
      pip = await window.documentPictureInPicture!.requestWindow({ width: 380, height: 560 })
    } catch {
      return // user dismissed or not allowed
    }
    pipRef.current = pip
    const disconnect = bridgeStyles(pip)
    const mount = pip.document.createElement('div')
    mount.style.height = '100%'
    pip.document.body.appendChild(mount)
    cleanupRef.current = disconnect
    pip.addEventListener('pagehide', teardown, { once: true })
    setContainer(mount)
  }, [supported, teardown])

  // Ensure the PiP window is closed if the provider ever unmounts (e.g. leaving /app).
  useEffect(() => () => close(), [close])

  // Auto-close the companion whenever the session becomes inactive — so End Session from ANYWHERE
  // (dock, record page, or the companion itself) tears the PiP down. Never leaves an orphaned window.
  useEffect(() => {
    if (container && !session.isActive) close()
  }, [container, session.isActive, close])

  const value: PipCompanionValue = { supported, isOpen: Boolean(container), open, close }

  return (
    <PipCompanionContext.Provider value={value}>
      {children}
      {container ? createPortal(<MeetingCompanion onClose={close} />, container) : null}
    </PipCompanionContext.Provider>
  )
}
