import { Wordmark } from '@/components/branding/logo'
import { Badge } from '@/components/data-display/badge'
import { FoundationsSection } from './sections/foundations'
import { TypographySection } from './sections/typography'
import { ButtonsSection } from './sections/buttons'
import { LinksSection } from './sections/links'
import { InputsSection } from './sections/inputs'
import { SelectionControlsSection } from './sections/selection-controls'
import { DateTimeSection } from './sections/date-time'
import { StatusMetadataSection } from './sections/status-metadata'
import { AvatarsPeopleSection } from './sections/avatars-people'
import { FeedbackSection } from './sections/feedback'
import { SurfacesLayoutSection } from './sections/surfaces-layout'
import { NavigationSection } from './sections/navigation'
import { DataDisplaySection } from './sections/data-display'
import { OverlaysSection } from './sections/overlays'
import { DisclosureSection } from './sections/disclosure'
import { RecallSection } from './sections/recall'
import { AccessibilitySection } from './sections/accessibility'
import { ResponsiveSection } from './sections/responsive'
import { MotionSection } from './sections/motion'

const NAV = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'typography', label: '1. Typography' },
  { id: 'buttons', label: '2. Buttons' },
  { id: 'links', label: '3. Links' },
  { id: 'inputs', label: '4. Inputs' },
  { id: 'selection-controls', label: '5. Selection controls' },
  { id: 'date-time', label: '6. Date and time' },
  { id: 'status-metadata', label: '7. Status and metadata' },
  { id: 'avatars-people', label: '8. Avatars and people' },
  { id: 'feedback', label: '9. Feedback' },
  { id: 'surfaces-layout', label: '10. Surfaces and layout' },
  { id: 'navigation', label: '11. Navigation' },
  { id: 'data-display', label: '12. Data display' },
  { id: 'overlays', label: '13. Overlays' },
  { id: 'disclosure', label: '14. Disclosure' },
  { id: 'recall', label: '15. Recall components' },
  { id: 'accessibility', label: '16. Accessibility' },
  { id: 'responsive', label: '17. Responsive behavior' },
  { id: 'motion', label: 'Motion' },
]

/**
 * Recall's design playground — every token and reusable component in one
 * place, grouped by category. Not a product page: nothing here ships.
 * "Foundations" and "Motion" sit outside the numbered list (0 and 18) —
 * they weren't in the requested 17, but the tokens and motion presets they
 * document are load-bearing for everything else on this page.
 */
export function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex max-w-[1400px]">
        <nav className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border px-4 py-8 lg:flex">
          <div className="mb-6 px-2">
            <Wordmark />
            <Badge variant="outline" className="mt-2">
              Design system
            </Badge>
          </div>
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="focus-ring rounded-md px-2 py-1.5 text-small text-muted-foreground transition-fast hover:bg-surface-hover hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-6 py-10 sm:px-10">
          <header className="flex flex-col gap-2 pb-4 lg:hidden">
            <Wordmark />
          </header>

          <div className="mb-4 flex flex-col gap-2">
            <h1 className="text-h1 font-semibold tracking-tight text-foreground">Design system</h1>
            <p className="max-w-2xl text-body-lg text-muted-foreground">
              The complete reusable component library Recall's product surfaces are composed from — tokens, typography, and
              every variant, state, and interaction pattern in one place.
            </p>
          </div>

          <FoundationsSection />
          <TypographySection />
          <ButtonsSection />
          <LinksSection />
          <InputsSection />
          <SelectionControlsSection />
          <DateTimeSection />
          <StatusMetadataSection />
          <AvatarsPeopleSection />
          <FeedbackSection />
          <SurfacesLayoutSection />
          <NavigationSection />
          <DataDisplaySection />
          <OverlaysSection />
          <DisclosureSection />
          <RecallSection />
          <AccessibilitySection />
          <ResponsiveSection />
          <MotionSection />
        </main>
      </div>
    </div>
  )
}
