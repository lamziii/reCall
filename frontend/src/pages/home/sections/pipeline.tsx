import { AudioLines, Sparkles, Network } from 'lucide-react'
import { SectionShell } from '../section-shell'
import { Stagger, RevealItem } from '../reveal'

const STEPS = [
  { icon: AudioLines, title: 'Record', body: 'Join any meeting — in person or on a call.' },
  { icon: Sparkles, title: 'Understand', body: 'AI lifts out decisions, tasks, and open questions.' },
  { icon: Network, title: 'Remember', body: 'Each one links to its people and projects, for good.' },
]

export function PipelineSection() {
  return (
    <SectionShell
      id="how"
      eyebrow="How it works"
      title="Talk. Recall does the rest."
      description="Three steps, fully automatic, after every conversation."
    >
      <Stagger className="grid gap-10 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <RevealItem key={s.title}>
            <div className="relative flex flex-col gap-4">
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-11 top-5 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-border-strong to-transparent md:block"
                />
              )}
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-accent">
                <s.icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-caption tracking-widest text-subtle-foreground">0{i + 1}</span>
                <h3 className="text-title font-semibold text-foreground">{s.title}</h3>
                <p className="max-w-[26ch] text-small text-muted-foreground">{s.body}</p>
              </div>
            </div>
          </RevealItem>
        ))}
      </Stagger>
    </SectionShell>
  )
}
