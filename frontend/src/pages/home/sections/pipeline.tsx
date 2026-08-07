import { AudioLines, FileText, Brain, Network } from 'lucide-react'
import { Body, Caption, Title } from '@/components/typography'
import { SectionShell } from '../section-shell'
import { Reveal } from '../reveal'

const STEPS = [
  {
    icon: AudioLines,
    step: 'Record',
    title: 'Join the conversation',
    body: 'Recall sits in on your meetings — in person or on any call — and captures crisp, private audio.',
  },
  {
    icon: FileText,
    step: 'Transcribe',
    title: 'Turn speech into text',
    body: 'A speaker-labeled transcript appears in seconds, searchable down to the sentence.',
  },
  {
    icon: Brain,
    step: 'Understand',
    title: 'Read the meaning',
    body: 'The model follows the thread — who committed to what, what was agreed, what stayed unresolved.',
  },
  {
    icon: Network,
    step: 'Extract',
    title: 'Build the knowledge',
    body: 'Decisions, tasks, and questions are structured and linked to the people and projects involved.',
  },
]

export function PipelineSection() {
  return (
    <SectionShell
      id="how"
      eyebrow="How it works"
      title="From spoken words to structured memory."
      description="Four steps run automatically after every meeting. You just talk — Recall does the rest."
    >
      <ol className="grid gap-8 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.step} delay={i * 0.08}>
            <li className="relative flex flex-col gap-4">
              {/* connector line to the next node (desktop only) */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-11 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-border-strong to-transparent md:block"
                />
              )}
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-accent">
                <s.icon className="size-4.5" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="flex flex-col gap-1.5">
                <Caption className="font-mono uppercase tracking-widest text-subtle-foreground">
                  {String(i + 1).padStart(2, '0')} · {s.step}
                </Caption>
                <Title as="h3" className="text-title">
                  {s.title}
                </Title>
                <Body className="text-muted-foreground">{s.body}</Body>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </SectionShell>
  )
}
