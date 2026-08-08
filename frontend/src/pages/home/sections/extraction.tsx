import { Card } from '@/components/data-display/card'
import { InsightLabel } from '@/components/recall/insight-label'
import { DecisionStatus } from '@/components/recall/decision-status'
import { TaskStatus } from '@/components/recall/task-status'
import { Assignee } from '@/components/recall/assignee'
import { DueDate } from '@/components/recall/due-date'
import { ConfidenceIndicator } from '@/components/recall/confidence-indicator'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { ProjectChip } from '@/components/recall/project-chip'
import { TimestampLink } from '@/components/recall/timestamp-link'
import { SectionShell } from '../section-shell'
import { Reveal, Stagger, RevealItem } from '../reveal'

const TRANSCRIPT: { time: string; speaker: string; text: string; accent?: boolean }[] = [
  { time: '12:04', speaker: 'Sarah', text: "Let's lock the launch for the 14th." },
  { time: '12:05', speaker: 'Sarah', text: 'We ship Pro at $20 — annual only for now.', accent: true },
  { time: '12:05', speaker: 'Marcus', text: "I'll own the pricing page copy by Friday." },
  { time: '12:06', speaker: 'Priya', text: 'Do we have legal sign-off on the new terms?' },
]

const FRIDAY = new Date(Date.now() + 3 * 86_400_000)

export function ExtractionSection() {
  return (
    <SectionShell
      eyebrow="From talk to knowledge"
      title="One conversation, quietly taken apart."
      description="Recall reads the meeting and lifts out what matters — as the same objects you work with everywhere else."
    >
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        {/* Source transcript */}
        <Reveal>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
              <span className="text-caption font-medium text-muted-foreground">Product sync · transcript</span>
              <span className="font-mono text-caption text-subtle-foreground">14:32</span>
            </div>
            <div className="flex flex-col gap-4 p-5">
              {TRANSCRIPT.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <TimestampLink time={line.time} active={line.accent} />
                  <div className="min-w-0">
                    <span className="text-small font-semibold text-foreground">{line.speaker}</span>
                    <p className={line.accent ? 'text-small text-foreground' : 'text-small text-muted-foreground'}>
                      {line.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Extracted product objects */}
        <Stagger className="flex flex-col gap-3">
          <RevealItem>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <InsightLabel type="decision" />
                <DecisionStatus status="approved" />
              </div>
              <p className="text-small font-medium text-foreground">Ship Pro at $20 — annual billing only at launch.</p>
              <div className="flex items-center gap-3 border-t border-border-subtle pt-3">
                <ConfidenceIndicator value={94} />
                <span className="text-caption text-subtle-foreground">· Pricing review</span>
              </div>
            </Card>
          </RevealItem>

          <RevealItem>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <InsightLabel type="task" />
                <TaskStatus status="todo" />
              </div>
              <p className="text-small font-medium text-foreground">Write pricing page copy</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-3">
                <Assignee name="Marcus Lee" />
                <DueDate date={FRIDAY} />
                <PriorityBadge priority="high" />
              </div>
            </Card>
          </RevealItem>

          <RevealItem>
            <Card className="flex flex-col gap-3 p-4">
              <InsightLabel type="question" />
              <p className="text-small font-medium text-foreground">Legal sign-off on the new terms?</p>
              <div className="flex items-center gap-2 border-t border-border-subtle pt-3">
                <span className="text-caption text-subtle-foreground">Raised by Priya · linked to</span>
                <ProjectChip name="Pricing" />
              </div>
            </Card>
          </RevealItem>
        </Stagger>
      </div>
    </SectionShell>
  )
}
