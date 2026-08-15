import { createContext, useContext, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Portal } from './portal'
import { useClickOutside, useEscapeKey } from '@/hooks'
import { cn } from '@/lib/utils'

interface ContextMenuContextValue {
  open: boolean
  point: { x: number; y: number }
  openAt: (point: { x: number; y: number }) => void
  close: () => void
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null)

export function ContextMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [point, setPoint] = useState({ x: 0, y: 0 })

  return (
    <ContextMenuContext.Provider
      value={{
        open,
        point,
        openAt: (p) => {
          setPoint(p)
          setOpen(true)
        },
        close: () => setOpen(false),
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  )
}

export function ContextMenuTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const ctx = useContext(ContextMenuContext)
  if (!ctx) throw new Error('<ContextMenuTrigger /> must be used inside <ContextMenu>')

  return (
    <div
      onContextMenu={(event) => {
        event.preventDefault()
        ctx.openAt({ x: event.clientX, y: event.clientY })
      }}
    >
      {children}
    </div>
  )
}

export function ContextMenuContent({ children, className }: { children: ReactNode; className?: string }) {
  const ctx = useContext(ContextMenuContext)
  const contentRef = useRef<HTMLDivElement>(null)
  if (!ctx) throw new Error('<ContextMenuContent /> must be used inside <ContextMenu>')
  const { open, point, close } = ctx

  useClickOutside([contentRef], close, open)
  useEscapeKey(close, open)

  const left = Math.min(point.x, window.innerWidth - 220)
  const top = Math.min(point.y, window.innerHeight - 240)

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            role="menu"
            style={{ position: 'fixed', top, left, zIndex: 'var(--z-popover)' }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'w-52 rounded-lg border border-border bg-surface-overlay p-1 shadow-lg outline-none',
              className,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

export { DropdownMenuItem as ContextMenuItem, DropdownMenuSeparator as ContextMenuSeparator } from './dropdown-menu'
