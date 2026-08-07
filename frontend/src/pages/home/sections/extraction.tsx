import type { ComponentType } from 'react'
import { CircleCheck, ListChecks, HelpCircle, ArrowRight } from 'lucide-react'
import { Body, Caption, Small } from '@/components/typography'
import { cn } from '@/lib/utils'
import { SectionShell } from '../section-shell'
import { Reveal } from '../reveal'

const TRANSCRIPT: { speaker: string; time: string; text: string; highlight?: 'decision' | 'task' | 'question' }[] = [
  { speaker: 'Sarah', time: '12:04', text: "Let's lock the launch for the 14th. I don't want to slip again." },
  { speaker: 'Marcus', time: '12:04', text: "Agreed. I'll own the pricing page copy and have it ready by Friday.", highlight: 'task' },
  { speaker: 'Sarah', time: '12:05', text: 'Good. So we ship the Pro tier at $20, annual only for now.', highlight: 'decision' },
  { speaker: 'Priya', time: '12:06', text: 'Do we have legal sign-off on the new terms yet?', highlight: 'question' },
]

const OUTPUTS: {
  kind: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  tone: string
  title: string
  meta: string
}[] = [
  {
    kind: 'Decision',
    icon: CircleCheck,
    tone: 'text-success',
    title: 'Ship the Pro tier at $20 — annual billing only at launch.',
    meta: 'Decided by Sarah · linked to Pricing',
  },
  {
    kind: 'Task',
    icon: ListChecks,
    tone: 'text-accent',
    title: 'Write pricing page copy',
    meta: 'Owner Marcus · due Friday',
  },
  {
    kind: 'Open question',
    icon: HelpCircle,
    tone: 'text-warning',
    title: 'Legal sign-off on the new terms?',
    meta: 'Raised by Priya · unresolved',
  },
]

const HIGHLIGHT_RING: Record<string, string> = {
  decision: 'text-success',
  task: 'text-accent',
  question: 'text-warning',
}

export function ExtractionSection() {
  return (
    <SectionShell
      eyebrow="What comes out of a meeting"
      title="One conversation. Everything that mattered, structured."
      description="Recall reads the transcript and separates the signal — decisions made, work assigned, questions still open — each traced back to the exact moment it was said."
    >
      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
        {/* Transcript */}
        <Reveal>
          <figure className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
            <figcaption className="flex items-center justify-between border-b border-border px-5 py-3">
              <Caption className="font-medium text-muted-foreground">Product sync · transcript</Caption>
              <Caption className="font-mono text-subtle-foreground">14:32</Caption>
            </figcaption>
            <div className="flex flex-col gap-4 p-5">
              {TRANSCRIPT.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-0.5 w-14 shrink-0 font-mono text-caption text-subtle-foreground">{line.time}</span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          'text-small font-semibold',
                          line.highlight ? HIGHLIGHT_RING[line.highlight] : 'text-foreground',
                        )}
                      >
                        {line.speaker}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-small leading-relaxed text-muted-foreground',
                        line.highlight &&
                          'rounded-md bg-surface-hover px-2 py-1 -mx-2 mt-0.5 text-foreground/90',
                      )}
                    >
                      {line.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </figure>
        </Reveal>

        {/* Arrow */}
        <div className="hidden items-center justify-center lg:flex">
          <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
            <ArrowRight className="size-4" aria-hidden />
          </div>
        </div>

        {/* Extracted knowledge */}
        <div className="flex flex-col gap-4">
          {OUTPUTS.map((o, i) => (
            <Reveal key={o.kind} delay={0.1 + i * 0.08}>
              <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-5">
                <o.icon className={cn('mt-0.5 size-5 shrink-0', o.tone)} strokeWidth={1.5} aria-hidden />
                <div className="min-w-0">
                  <Caption className="font-mono uppercase tracking-widest text-subtle-foreground">{o.kind}</Caption>
                  <Body className="mt-1 font-medium text-foreground">{o.title}</Body>
                  <Small className="mt-1.5 block text-subtle-foreground">{o.meta}</Small>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
