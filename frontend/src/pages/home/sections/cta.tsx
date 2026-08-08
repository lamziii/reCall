import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { Reveal } from '../reveal'
import dashboardImage from '@/assets/marketing/recall-session-review.webp'

export function CtaSection() {
  const navigate = useNavigate()
  return (
    <section className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <Container width="page">
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-border bg-surface px-6 pt-20 text-center sm:px-12 sm:pt-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_46%_60%_at_50%_0%,color-mix(in_oklch,var(--color-accent-500)_20%,transparent),transparent_72%)]"
          />
          <Reveal>
            <h2 className="mx-auto max-w-[16ch] text-balance text-[clamp(1.875rem,1.3rem+2.2vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground">
              A memory that never forgets.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-4 max-w-[36ch] text-body-lg text-muted-foreground">
              Start free. Your first meeting is searchable in minutes.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" rightIcon={<ArrowRight />} onClick={() => navigate('/onboarding')}>
                Start free
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/plans')}>
                See pricing
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mt-5 text-caption text-subtle-foreground">
              No credit card required ·{' '}
              <Link to="/login" className="focus-ring rounded-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                Sign in
              </Link>
            </p>
          </Reveal>

          {/* Small dashboard preview, fading into the panel */}
          <Reveal delay={0.3} className="mt-14">
            <div className="relative mx-auto max-w-3xl">
              <div aria-hidden className="hero-dashboard-ambient pointer-events-none absolute -inset-x-10 -top-8 -z-10 h-40 rounded-xl" />
              <img
                src={dashboardImage}
                alt=""
                aria-hidden
                width={1586}
                height={992}
                loading="lazy"
                decoding="async"
                className="block w-full rounded-t-xl border border-border border-b-0 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.6)]"
                style={{ maskImage: 'linear-gradient(to bottom, black 55%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent)' }}
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
