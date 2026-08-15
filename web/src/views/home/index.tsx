import { VisuallyHidden } from '@/components/primitives/visually-hidden'
import { Navigation } from './navigation'
import { Hero } from './hero'
import { ValueSection } from './sections/value'
import { PipelineSection } from './sections/pipeline'
import { ExtractionSection } from './sections/extraction'
import { SearchSection } from './sections/search'
import { GraphSection } from './sections/graph'
import { SecuritySection } from './sections/security'
import { FaqSection } from './sections/faq'
import { CtaSection } from './sections/cta'
import { Footer } from './footer'
import { useScrollToHash } from './use-scroll-to-hash'

export function HomePage() {
  useScrollToHash()

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
        <SearchSection />
        <GraphSection />
        <SecuritySection />
        <FaqSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  )
}
