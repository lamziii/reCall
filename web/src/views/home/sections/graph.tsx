import { Container } from '@/components/layout/container'
import { Small } from '@/components/typography'
import { Reveal } from '../reveal'
import { KnowledgeGraph } from '../visuals/knowledge-graph'

const LEGEND = [
  { label: 'Project', color: 'var(--color-accent-500)' },
  { label: 'Meeting', color: 'var(--color-neutral-300)' },
  { label: 'Person', color: 'var(--color-neutral-400)' },
  { label: 'Decision', color: 'var(--color-green-500)' },
]

export function GraphSection() {
  return (
    <section className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <Container width="page">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col items-start">
            <Reveal className="mb-5">
              <span className="inline-flex items-center gap-2 text-caption font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                <span className="size-1 rounded-full bg-accent" aria-hidden />
                Why it's different
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="max-w-[15ch] text-balance text-[clamp(1.625rem,1.2rem+1.6vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-foreground">
                Notes get filed. Memory connects.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-[38ch] text-body-lg text-muted-foreground">
                Every meeting is stored as links — not a document that fades the moment it's saved.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-[38ch] text-body text-foreground">
                Ask <span className="text-accent">"why annual billing?"</span> and Recall walks the graph back to the
                room where it was decided.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <KnowledgeGraph />
              <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {LEGEND.map((l) => (
                  <li key={l.label} className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
                    <Small className="text-muted-foreground">{l.label}</Small>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
