import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfidenceIndicator } from '@/components/recall/confidence-indicator'
import { DueDate } from '@/components/recall/due-date'
import { Alert } from '@/components/feedback/alert'
import { PlaygroundSection } from '../playground-section'

const CHECKLIST = [
  'Every interactive component is reachable and operable by keyboard alone (Tab, Shift+Tab, arrows where a roving-tabindex pattern applies, Enter/Space, Escape).',
  'Focus is always visible — the shared .focus-ring utility (styles/tokens/index.css) is the only focus treatment used anywhere in the system.',
  'Overlays (Dialog, Drawer, Popover, DropdownMenu, ContextMenu, CommandMenu) trap focus while open and return it to the trigger on close.',
  'Native elements are used wherever they carry built-in semantics for free: <dialog>, <select>, <input type="range/date/time">, real <button>/<a> elements.',
  'Every icon-only control (IconButton, PriorityIndicator, CopyButton) has an accessible name via aria-label — never relies on a tooltip alone.',
  'Form controls associate label, description, and error text via FormField’s generated ids and aria-describedby/aria-invalid.',
  'Status is never color-only: ConfidenceIndicator and DueDate below always pair color with a visible number or word.',
  '@media (prefers-reduced-motion: reduce) collapses all animation/transition durations to ~0 globally (styles/tokens/index.css) — no per-component opt-out needed.',
]

export function AccessibilitySection() {
  return (
    <PlaygroundSection
      id="accessibility"
      title="Accessibility"
      description="This system targets WCAG 2.2 AA. That's a target, not a certification — it has not been through a formal audit or assistive-technology testing pass yet."
    >
      <Alert
        variant="warning"
        title="Target, not a guarantee"
        description="WCAG 2.2 AA is the bar every component below is built against. Formal testing (screen readers, a contrast audit, an AT walkthrough) still needs to happen before this can be called compliant."
        className="max-w-2xl"
      />

      <ul className="flex max-w-2xl flex-col gap-2.5">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-small text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">
          Try it: Tab through these buttons — focus is always visible
        </span>
        <div className="flex gap-3">
          <Button variant="secondary">First</Button>
          <Button variant="secondary">Second</Button>
          <Button variant="secondary">Third</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Color is never the only signal</span>
        <div className="flex flex-wrap gap-4">
          <ConfidenceIndicator value={28} variant="detailed" />
          <DueDate date={new Date()} />
        </div>
      </div>
    </PlaygroundSection>
  )
}
