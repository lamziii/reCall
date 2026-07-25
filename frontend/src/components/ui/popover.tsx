import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Portal } from './portal'
import { useClickOutside, useControllableState, useEscapeKey, useFocusTrap } from '@/hooks'
import { cn, getPopoverPosition, mergeRefs } from '@/lib/utils'
import type { Placement } from '@/lib/utils'

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext(component: string) {
  const ctx = useContext(PopoverContext)
  if (!ctx) throw new Error(`<${component} /> must be used inside <Popover>`)
  return ctx
}

export interface PopoverProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Headless, controllable open/close container. Pair with PopoverTrigger + PopoverContent. */
export function Popover({ children, open, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  const triggerRef = useRef<HTMLElement | null>(null)

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen, triggerRef }}>{children}</PopoverContext.Provider>
  )
}

export function PopoverTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const { open, setOpen, triggerRef } = usePopoverContext('PopoverTrigger')
  if (!isValidElement(children)) return children

  const child = children as ReactElement<Record<string, unknown>> & { ref?: React.Ref<HTMLElement> }

  return cloneElement(child, {
    ref: mergeRefs(triggerRef, child.ref),
    'aria-expanded': open,
    'aria-haspopup': true,
    onClick: (event: React.MouseEvent) => {
      ;(child.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(event)
      setOpen(!open)
    },
  })
}

export interface PopoverContentProps {
  children: ReactNode
  placement?: Placement
  className?: string
  trapFocus?: boolean
  width?: number
}

export function PopoverContent({
  children,
  placement = 'bottom-start',
  className,
  trapFocus = false,
  width,
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = usePopoverContext('PopoverContent')
  const contentRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const close = () => setOpen(false)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    setCoords(getPopoverPosition(triggerRect, contentRect, placement))
  }, [open, placement, children, triggerRef])

  useClickOutside([triggerRef, contentRef], close, open)
  useEscapeKey(close, open)
  useFocusTrap(contentRef, open && trapFocus)

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={contentRef}
            role="dialog"
            style={{
              position: 'fixed',
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              width,
              zIndex: 'var(--z-popover)',
              visibility: coords ? 'visible' : 'hidden',
            }}
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'rounded-lg border border-border bg-surface-overlay shadow-lg outline-none',
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
