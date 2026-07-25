import type { ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

export interface DetailsListItem {
  id: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

export interface DetailsListProps {
  items: DetailsListItem[]
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
}

/** Declarative, array-driven disclosure list — built on Accordion for the single/multiple-expansion engine. */
export function DetailsList({ items, type = 'single', defaultValue, className }: DetailsListProps) {
  return (
    <Accordion type={type} defaultValue={defaultValue} className={className}>
      {items.map((item) =>
        item.disabled ? (
          <div key={item.id} className="flex items-center py-3.5 text-small font-medium text-disabled-foreground">
            {item.label}
          </div>
        ) : (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.label}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ),
      )}
    </Accordion>
  )
}
