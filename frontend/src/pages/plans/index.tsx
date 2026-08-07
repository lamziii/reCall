import { VisuallyHidden } from '@/components/primitives/visually-hidden'
import { Container } from '@/components/layout/container'
import { Grid } from '@/components/layout/grid'
import { BodyLarge, Caption } from '@/components/typography'
import { Reveal } from '@/pages/home/reveal'
import { Navigation } from '@/pages/home/navigation'
import { PlanCard } from './plan-card'
import { MARKETING_PLANS } from './plan-data'

export function PlansPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <VisuallyHidden as="a" href="#main-content" focusable>
        Skip to content
      </VisuallyHidden>

      <Navigation />

      <main id="main-content">
        <section className="relative pt-20 pb-32 sm:pt-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]"
          />

          <Container width="page">
            <div className="flex flex-col items-center text-center">
              <Reveal>
                <Caption className="mb-4 text-subtle-foreground">Pricing</Caption>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mb-4 text-[clamp(2rem,1.5rem+2.5vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
                  Plans that scale with your team.
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <BodyLarge className="max-w-[520px] text-muted-foreground">
                  Start solo, then bring your team in when you're ready. Every plan includes AI summaries, decisions,
                  and tasks pulled straight out of your conversations.
                </BodyLarge>
              </Reveal>
            </div>

            <Reveal delay={0.24} className="mt-16">
              <Grid cols={3} gap={6} className="items-stretch">
                {MARKETING_PLANS.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </Grid>
            </Reveal>

            <Reveal delay={0.3} className="mt-10">
              <p className="text-center text-small text-subtle-foreground">
                Prices in USD, billed monthly. Need something different?{' '}
                <a href="mailto:sales@recall.app" className="focus-ring rounded-sm text-foreground underline underline-offset-4">
                  Talk to us
                </a>
                .
              </p>
            </Reveal>
          </Container>
        </section>
      </main>
    </div>
  )
}
