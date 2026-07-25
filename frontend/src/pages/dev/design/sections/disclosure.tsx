import { useState } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/navigation/accordion'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { DetailsList } from '@/components/navigation/details-list'
import { Button } from '@/components/ui/button'
import { PlaygroundSection } from '../playground-section'

export function DisclosureSection() {
  const [collapsibleOpen, setCollapsibleOpen] = useState(false)

  return (
    <PlaygroundSection
      id="disclosure"
      title="Disclosure"
      description="Accordion, Collapsible, and DetailsList — the same open/close engine at three levels of ceremony."
    >
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">
          Interactive: Accordion (single expansion)
        </span>
        <Accordion type="single" defaultValue="risks" className="w-full max-w-lg rounded-xl border border-border px-4">
          <AccordionItem value="risks">
            <AccordionTrigger>Risks</AccordionTrigger>
            <AccordionContent>Two open risks were flagged during the session, both assigned to engineering.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="questions">
            <AccordionTrigger>Open questions</AccordionTrigger>
            <AccordionContent>Three questions remain unresolved pending stakeholder input.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Accordion (multiple expansion)</span>
        <Accordion type="multiple" defaultValue={['decisions', 'tasks']} className="w-full max-w-lg rounded-xl border border-border px-4">
          <AccordionItem value="decisions">
            <AccordionTrigger>Decisions</AccordionTrigger>
            <AccordionContent>Ship the v2 onboarding flow; delay the pricing model change to Q4.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="tasks">
            <AccordionTrigger>Tasks</AccordionTrigger>
            <AccordionContent>Marcus to draft the updated architecture proposal by Friday.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Interactive: Collapsible</span>
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
          <CollapsibleTrigger>
            <Button variant="secondary">{collapsibleOpen ? 'Hide transcript' : 'Show transcript'}</Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 max-w-lg rounded-lg border border-border bg-surface p-4 text-small text-muted-foreground">
            Full transcript content would render here once expanded.
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">DetailsList (declarative, with a disabled item)</span>
        <DetailsList
          className="w-full max-w-lg rounded-xl border border-border px-4"
          items={[
            { id: 'summary', label: 'Executive Summary', content: 'The team aligned on Q3 priorities and the onboarding timeline.' },
            { id: 'insights', label: 'Insights', content: '3 insights were surfaced, all related to activation drop-off.' },
            { id: 'archived', label: 'Archived notes', content: '', disabled: true },
          ]}
        />
      </div>
    </PlaygroundSection>
  )
}
