import { CheckSquare, FileText, FolderKanban, GitBranch, HelpCircle, User, Video } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Badge } from '@/components/data-display/badge'
import { Reveal, Stagger, RevealItem } from '../reveal'

const OBJECTS = [
  { icon: Video, label: 'Sessions' },
  { icon: GitBranch, label: 'Decisions' },
  { icon: CheckSquare, label: 'Tasks' },
  { icon: HelpCircle, label: 'Questions' },
  { icon: FolderKanban, label: 'Projects' },
  { icon: User, label: 'People' },
  { icon: FileText, label: 'Documents' },
]

export function ValueSection() {
  return (
    <section className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <Container width="page">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-balance text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-foreground">
              Not a notes app.
              <br />
              <span className="text-muted-foreground">Your organization's memory.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-[38ch] text-body-lg text-muted-foreground">
              Every conversation becomes connected knowledge — and it compounds with each one.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-14 flex flex-wrap items-center justify-center gap-2.5" amount={0.4}>
          {OBJECTS.map((o) => (
            <RevealItem key={o.label}>
              <Badge variant="outline" icon={<o.icon />} className="px-3 py-1.5 text-small">
                {o.label}
              </Badge>
            </RevealItem>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}
