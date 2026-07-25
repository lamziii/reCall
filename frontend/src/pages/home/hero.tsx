import { Container } from '@/components/layout/container'
import { BodyLarge, Label } from '@/components/typography'
import { Reveal } from './reveal'
import heroImage from '@/assets/marketing/recall-session-review.webp'

export function Hero() {
  return (
    <section id="top" className="relative pt-40 pb-32 sm:pt-52">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.04),transparent_70%)]"
      />

      <Container width="page">
        <div className="flex flex-col items-start">
          <Reveal>
            <Label as="span" className="mb-4">
              AI workspace for organizational memory
            </Label>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mb-6 text-[clamp(2.5rem,1.75rem+4vw,5.25rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              Turn every conversation
              <br />
              into knowledge.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <BodyLarge className="max-w-[500px] text-muted-foreground">
              Recall records your meetings and turns them into decisions, tasks, and structured knowledge your team
              can search forever.
            </BodyLarge>
          </Reveal>
        </div>

        <Reveal delay={0.28} className="mt-12">
          <div className="relative isolate">
            <div aria-hidden className="hero-dashboard-ambient pointer-events-none absolute -inset-x-16 -top-16 -z-10 h-56 rounded-xl" />
            <div aria-hidden className="hero-dashboard-halo pointer-events-none absolute -inset-3 rounded-2xl blur-[6px]" />
            <img
              src={heroImage}
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
