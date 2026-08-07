import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { BodyLarge } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { Reveal } from '../reveal'

export function CtaSection() {
  const navigate = useNavigate()
  return (
    <section className="scroll-mt-24 py-24 sm:py-32">
      <Container width="page">
        <div className="relative isolate overflow-hidden rounded-3xl border border-border bg-surface px-6 py-20 text-center sm:px-12 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,color-mix(in_oklch,var(--color-accent-500)_16%,transparent),transparent_70%)]"
          />
          <Reveal>
            <h2 className="mx-auto max-w-[18ch] text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] font-semibold leading-[1.08] tracking-tight text-foreground">
              Give your team a memory that never forgets.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <BodyLarge className="mx-auto mt-5 max-w-[44ch] text-muted-foreground">
              Start free today. Your first meeting becomes searchable knowledge in minutes.
            </BodyLarge>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" rightIcon={<ArrowRight />} onClick={() => navigate('/onboarding')}>
                Start free
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/plans')}>
                See pricing
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mt-6 text-small text-subtle-foreground">
              No credit card required.{' '}
              <Link to="/login" className="focus-ring rounded-sm text-foreground underline underline-offset-4">
                Sign in
              </Link>{' '}
              if you already have an account.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
