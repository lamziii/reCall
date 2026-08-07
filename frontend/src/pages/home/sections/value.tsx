import { Mic, Sparkles, Infinity as InfinityIcon } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Body, Title } from '@/components/typography'
import { Reveal } from '../reveal'

const PILLARS = [
  {
    icon: Mic,
    title: 'It captures',
    body: 'Every meeting is recorded and transcribed with speaker-level accuracy. Nothing is lost the moment the call ends.',
  },
  {
    icon: Sparkles,
    title: 'It understands',
    body: 'Recall reads the conversation the way a great chief of staff would — pulling out what was decided, owed, and left open.',
  },
  {
    icon: InfinityIcon,
    title: 'It remembers',
    body: 'Each meeting is linked to the people and projects it touches, so your knowledge compounds instead of scrolling away.',
  },
]

export function ValueSection() {
  return (
    <section className="scroll-mt-24 py-24 sm:py-32">
      <Container width="page">
        <div className="max-w-[38ch]">
          <Reveal>
            <p className="text-[clamp(1.5rem,1.1rem+1.6vw,2.25rem)] font-medium leading-[1.3] tracking-tight text-foreground">
              Recall isn't another meeting-notes app.{' '}
              <span className="text-muted-foreground">
                It's an AI memory system — every conversation permanently improves what your organization knows.
              </span>
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <div className="flex h-full flex-col gap-4 bg-bg p-8">
                <pillar.icon className="size-5 text-accent" strokeWidth={1.5} aria-hidden />
                <Title as="h3">{pillar.title}</Title>
                <Body className="text-muted-foreground">{pillar.body}</Body>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
