import { useNavigate } from '@/lib/router-compat'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { BodyLarge } from '@/components/typography'
import { Reveal } from './reveal'
import heroImage from '@/assets/marketing/recall-session-review.webp'

export function Hero() {
  const navigate = useNavigate()

  return (
    <section id="top" className="relative pt-36 pb-28 sm:pt-44 lg:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]"
      />

      <Container width="page">
        <div className="flex flex-col items-start">
          <Reveal className="mb-5">
            <span className="inline-flex items-center gap-2 text-caption font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              <span className="size-1 rounded-full bg-accent" aria-hidden />
              AI memory for organizations
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mb-6 text-[clamp(2.5rem,1.75rem+4vw,5rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-foreground">
              Turn every conversation
              <br />
              into knowledge.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <BodyLarge className="max-w-[480px] text-muted-foreground">
              Recall records your meetings, understands what happened, and turns them into decisions, tasks, and
              knowledge your team can search forever.
            </BodyLarge>
          </Reveal>

          <Reveal delay={0.22}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" rightIcon={<ArrowRight />} onClick={() => navigate('/onboarding')}>
                Start for free
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/plans')}>
                See pricing
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3} className="mt-14">
          <div className="relative isolate">
            <div aria-hidden className="hero-dashboard-ambient pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[460px] blur-2xl" />
            <div aria-hidden className="hero-dashboard-halo pointer-events-none absolute -inset-3 rounded-2xl blur-[6px]" />
            <img
              src={heroImage.src}
              alt="Recall session review interface showing meeting summary, decisions, tasks, open questions, timeline, participants, and assistant panel."
              width={1586}
              height={992}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="relative block w-full rounded-xl border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55),0_0_60px_-25px_rgba(79,125,255,0.25)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-xl bg-gradient-to-t from-bg to-transparent"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
