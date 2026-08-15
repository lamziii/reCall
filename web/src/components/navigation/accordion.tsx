import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface AccordionContextValue {
  isOpen: (value: string) => boolean
  toggle: (value: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<string | null>(null)

export interface AccordionProps {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
  children: ReactNode
}

export function Accordion({ type = 'single', defaultValue, className, children }: AccordionProps) {
  const [openValues, setOpenValues] = useState<Set<string>>(
    new Set(Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []),
  )

  function toggle(value: string) {
    setOpenValues((current) => {
      const next = new Set(type === 'multiple' ? current : [])
      if (current.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  return (
    <AccordionContext.Provider value={{ isOpen: (value) => openValues.has(value), toggle }}>
      <div className={cn('flex flex-col divide-y divide-border-subtle', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('<AccordionItem /> must be used inside <Accordion>')

  return (
    <AccordionItemContext.Provider value={value}>
      <Collapsible open={ctx.isOpen(value)} onOpenChange={() => ctx.toggle(value)}>
        {children}
      </Collapsible>
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger({ children }: { children: ReactNode }) {
  return (
    <CollapsibleTrigger>
      <button
        type="button"
        className="focus-ring group flex w-full items-center justify-between py-3.5 text-left text-small font-medium text-foreground transition-fast hover:text-accent"
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-subtle-foreground transition-fast group-aria-expanded:rotate-180" />
      </button>
    </CollapsibleTrigger>
  )
}

export function AccordionContent({ children, className }: { children: ReactNode; className?: string }) {
  return <CollapsibleContent className={cn('pb-4 text-small text-muted-foreground', className)}>{children}</CollapsibleContent>
}
