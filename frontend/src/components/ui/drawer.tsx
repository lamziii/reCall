import { cloneElement, createContext, isValidElement, useContext, useEffect, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useControllableState } from '@/hooks'
import { cn } from '@/lib/utils'

interface DrawerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DrawerContext = createContext<DrawerContextValue | null>(null)

function useDrawerContext(component: string) {
  const ctx = useContext(DrawerContext)
  if (!ctx) throw new Error(`<${component} /> must be used inside <Drawer>`)
  return ctx
}

export interface DrawerProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Same native-<dialog> engine as Dialog, edge-pinned instead of centered. */
export function Drawer({ children, open, defaultOpen = false, onOpenChange }: DrawerProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  return <DrawerContext.Provider value={{ open: isOpen, setOpen }}>{children}</DrawerContext.Provider>
}

export function DrawerTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const { setOpen } = useDrawerContext('DrawerTrigger')
  if (!isValidElement(children)) return children
  const child = children as ReactElement<Record<string, unknown>>

  return cloneElement(child, {
    onClick: (event: React.MouseEvent) => {
      ;(child.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(event)
      setOpen(true)
    },
  })
}

export interface DrawerContentProps {
  children: ReactNode
  side?: 'right' | 'left'
  className?: string
  'aria-label'?: string
}

export function DrawerContent({ children, side = 'right', className, 'aria-label': ariaLabel }: DrawerContentProps) {
  const { open, setOpen } = useDrawerContext('DrawerContent')
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
  }, [open])

  return (
    <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
      {open && (
        <motion.dialog
          ref={dialogRef}
          aria-label={ariaLabel}
          onCancel={(event) => {
            event.preventDefault()
            setOpen(false)
          }}
          onClick={(event) => {
            if (event.target === dialogRef.current) setOpen(false)
          }}
          initial={{ x: side === 'right' ? '100%' : '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: side === 'right' ? '100%' : '-100%' }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'm-0 h-dvh max-h-none w-full max-w-sm border-border bg-surface-raised p-6 text-foreground shadow-xl',
            side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r',
            'backdrop:bg-neutral-950/70',
            className,
          )}
          style={{ position: 'fixed', top: 0, bottom: 0, [side]: 0 }}
        >
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() => setOpen(false)}
            className="focus-ring absolute right-4 top-4 rounded-md p-1 text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
          {children}
        </motion.dialog>
      )}
    </AnimatePresence>
  )
}

export { DialogHeader as DrawerHeader, DialogTitle as DrawerTitle, DialogDescription as DrawerDescription, DialogFooter as DrawerFooter } from './dialog'
