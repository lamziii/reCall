import { VisuallyHidden } from '@/components/primitives/visually-hidden'
import { Navigation } from './navigation'
import { Hero } from './hero'

export function HomePage() {
  return (
    <div className="min-h-dvh bg-bg">
      <VisuallyHidden as="a" href="#main-content" focusable>
        Skip to content
      </VisuallyHidden>

      <Navigation />

      <main id="main-content">
        <Hero />
      </main>
    </div>
  )
}
