import { Container } from '@/components/layout/container'
import { BodyLarge, Body, Label, Small } from '@/components/typography'
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
    <section className="scroll-mt-24 py-24 sm:py-32">
      <Container width="page">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start">
            <Reveal>
              <Label as="span" className="mb-4 block text-subtle-foreground">
                Why it beats notes
              </Label>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="max-w-[16ch] text-[clamp(1.875rem,1.3rem+2.2vw,3rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
                Notes are forgotten. Memory connects.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <BodyLarge className="mt-5 max-w-[46ch] text-muted-foreground">
                A document is a dead end — the moment it's filed, it starts to fade. Recall stores every meeting as
                links, not files. People, projects, and decisions connect automatically, so context is one click away
                and gets richer with each conversation.
              </BodyLarge>
            </Reveal>
            <Reveal delay={0.18}>
              <Body className="mt-6 max-w-[46ch] text-foreground">
                Ask <span className="text-accent">"why did we choose annual billing?"</span> and Recall walks the graph
                back to the meeting, the person, and the moment it was decided.
              </Body>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
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
