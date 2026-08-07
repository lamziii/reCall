import { VisuallyHidden } from '@/components/primitives/visually-hidden'
import { Navigation } from './navigation'
import { Hero } from './hero'
import { ValueSection } from './sections/value'
import { PipelineSection } from './sections/pipeline'
import { ExtractionSection } from './sections/extraction'
import { GraphSection } from './sections/graph'
import { SearchSection } from './sections/search'
import { SecuritySection } from './sections/security'
import { FaqSection } from './sections/faq'
import { CtaSection } from './sections/cta'
import { Footer } from './footer'

export function HomePage() {
  return (
    <div className="min-h-dvh bg-bg">
      <VisuallyHidden as="a" href="#main-content" focusable>
        Skip to content
      </VisuallyHidden>

      <Navigation />

      <main id="main-content">
        <Hero />
        <ValueSection />
        <PipelineSection />
        <ExtractionSection />
        <GraphSection />
        <SearchSection />
        <SecuritySection />
        <FaqSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  )
}
