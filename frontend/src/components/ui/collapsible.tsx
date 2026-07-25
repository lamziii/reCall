import { cloneElement, createContext, isValidElement, useContext, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useControllableState } from '@/hooks'
import { cn } from '@/lib/utils'

interface CollapsibleContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  contentId: string
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

function useCollapsibleContext(component: string) {
  const ctx = useContext(CollapsibleContext)
  if (!ctx) throw new Error(`<${component} /> must be used inside <Collapsible>`)
  return ctx
}

export interface CollapsibleProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Headless open/close-with-height-animation primitive. Accordion is built on top of this. */
export function Collapsible({ children, open, defaultOpen = false, onOpenChange }: CollapsibleProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange })
  const contentId = useId()

  return <CollapsibleContext.Provider value={{ open: isOpen, setOpen, contentId }}>{children}</CollapsibleContext.Provider>
}

export function CollapsibleTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const { open, setOpen, contentId } = useCollapsibleContext('CollapsibleTrigger')
  if (!isValidElement(children)) return children
  const child = children as ReactElement<Record<string, unknown>>

  return cloneElement(child, {
    'aria-expanded': open,
    'aria-controls': contentId,
    onClick: (event: React.MouseEvent) => {
      ;(child.props.onClick as ((e: React.MouseEvent) => void) | undefined)?.(event)
      setOpen(!open)
    },
  })
}

export function CollapsibleContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open, contentId } = useCollapsibleContext('CollapsibleContent')

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={contentId}
          role="region"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className={cn(className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
