import { cloneElement, createContext, isValidElement, useContext, useEffect, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useControllableState } from '@/hooks'
import { cn } from '@/lib/utils'

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext(component: string) {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error(`<${component} /> must be used inside <Dialog>`)
  return ctx
}

export interface DialogProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Built on native <dialog> for free focus-trap/top-layer/::backdrop semantics.
 * Escape and backdrop clicks route through React state (instead of native
 * instant-close) so the exit animation can play before unmount.
 */
export function Dialog({ children, open, defaultOpen = false, onOpenChange }: DialogProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  return <DialogContext.Provider value={{ open: isOpen, setOpen }}>{children}</DialogContext.Provider>
}

export function DialogTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const { setOpen } = useDialogContext('DialogTrigger')
  if (!isValidElement(children)) return children
  const child = children as ReactElement<Record<string, unknown>>

  return cloneElement(child, {
    onClick: (event: React.MouseEvent) => {
      ;(child.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(event)
      setOpen(true)
    },
  })
}

export interface DialogContentProps {
  children: ReactNode
  className?: string
  showClose?: boolean
}

export function DialogContent({ children, className, showClose = true }: DialogContentProps) {
  const { open, setOpen } = useDialogContext('DialogContent')
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
  }, [open])

  return (
    <AnimatePresence
      onExitComplete={() => {
        dialogRef.current?.close()
      }}
    >
      {open && (
        <motion.dialog
          ref={dialogRef}
          onCancel={(event) => {
            event.preventDefault()
            setOpen(false)
          }}
          onClick={(event) => {
            if (event.target === dialogRef.current) setOpen(false)
          }}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'relative m-auto w-full max-w-md rounded-xl border border-border bg-surface-raised p-6 text-foreground shadow-xl',
            'backdrop:bg-neutral-950/70',
            className,
          )}
        >
          {showClose && (
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => setOpen(false)}
              className="focus-ring absolute right-4 top-4 rounded-md p-1 text-subtle-foreground transition-fast hover:bg-surface-hover hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          {children}
        </motion.dialog>
      )}
    </AnimatePresence>
  )
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-col gap-1 pr-6', className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('text-title font-semibold text-foreground', className)}>{children}</h2>
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-small text-muted-foreground', className)}>{children}</p>
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)}>{children}</div>
}

export function DialogClose({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const { setOpen } = useDialogContext('DialogClose')
  if (!isValidElement(children)) return children
  const child = children as ReactElement<Record<string, unknown>>

  return cloneElement(child, {
    onClick: (event: React.MouseEvent) => {
      ;(child.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(event)
      setOpen(false)
    },
  })
}
