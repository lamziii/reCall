import { cloneElement, isValidElement, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Portal } from './portal'
import { getPopoverPosition, mergeRefs } from '@/lib/utils'
import type { Placement } from '@/lib/utils'

export interface TooltipProps {
  children: ReactElement<Record<string, unknown>>
  content: ReactNode
  placement?: Placement
  delay?: number
}

/** Hover/focus-triggered label. No focus trap, no click-outside — dismisses on blur/mouseleave. */
export function Tooltip({ children, content, placement = 'top', delay = 300 }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function show() {
    timeoutRef.current = setTimeout(() => setOpen(true), delay)
  }

  function hide() {
    clearTimeout(timeoutRef.current)
    setOpen(false)
  }

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    setCoords(getPopoverPosition(triggerRect, contentRect, placement))
  }, [open, placement])

  if (!isValidElement(children)) return children
  const child = children as ReactElement<Record<string, unknown>> & { ref?: React.Ref<HTMLElement> }

  return (
    <>
      {cloneElement(child, {
        ref: mergeRefs(triggerRef, child.ref),
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
        'aria-describedby': open ? 'tooltip' : undefined,
      })}
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={contentRef}
              id="tooltip"
              role="tooltip"
              style={{
                position: 'fixed',
                top: coords?.top ?? -9999,
                left: coords?.left ?? -9999,
                zIndex: 'var(--z-tooltip)',
                visibility: coords ? 'visible' : 'hidden',
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none rounded-md border border-border-subtle bg-surface-overlay px-2 py-1 text-caption text-foreground shadow-sm"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}
