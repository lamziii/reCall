import { motion } from 'framer-motion'
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
import { cn } from '@/lib/utils'
import { SectionShell } from '../section-shell'
import { Reveal } from '../reveal'
import { useDemoTimeline } from '../demos/use-demo-timeline'
import { DEMO_TRANSCRIPT, DEMO_FRIDAY, DEMO_PEOPLE } from '../demos/demo-data'

const EASE = [0.16, 1, 0.3, 1] as const
const DURATION = 6600

// Each knowledge object appears just after the sentence that produced it — so you watch the meeting
// come apart, line by line, into the same objects you work with in the app.
const KNOWLEDGE_AT = { decision: 2500, task: 2900, question: 4300 }

export function ExtractionSection() {
  const { ref, elapsed, reduced } = useDemoTimeline({ duration: DURATION })
  const firedLines = DEMO_TRANSCRIPT.filter((l) => elapsed >= l.at)
  const shown = (at: number) => elapsed >= at

  const appear = (visible: boolean, delay = 0) =>
    reduced || !visible
      ? { animate: { opacity: visible ? 1 : 0.35, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 10, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.45, ease: EASE, delay },
        }

  return (
    <SectionShell
      eyebrow="From talk to knowledge"
      title="One conversation, quietly taken apart."
      description="Recall reads the meeting and lifts out what matters — as the same objects you work with everywhere else."
    >
      <div ref={ref} className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        {/* Source transcript — lines stream in */}
        <Reveal>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
              <span className="text-caption font-medium text-muted-foreground">Product Launch Review · transcript</span>
              <span className="font-mono text-caption text-subtle-foreground">00:31</span>
            </div>
            <div className="flex min-h-[220px] flex-col gap-4 p-5">
              {firedLines.map((line) => (
                <motion.div key={line.time} {...appear(true)} className="flex gap-3">
                  <TimestampLink time={line.time} active={line.accent} />
                  <div className="min-w-0">
                    <span className="text-small font-semibold text-foreground">{line.speaker}</span>
                    <p className={cn('text-small', line.accent ? 'text-foreground' : 'text-muted-foreground')}>{line.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Extracted product objects — each lands as its sentence is spoken */}
        <div className="flex flex-col gap-3">
          <motion.div key={`d-${shown(KNOWLEDGE_AT.decision)}`} {...appear(shown(KNOWLEDGE_AT.decision))}>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <InsightLabel type="decision" />
                <DecisionStatus status="approved" />
              </div>
              <p className="text-small font-medium text-foreground">Launch moves to September 18.</p>
              <div className="flex items-center gap-3 border-t border-border-subtle pt-3">
                <ConfidenceIndicator value={96} />
                <span className="text-caption text-subtle-foreground">· Public Launch</span>
              </div>
            </Card>
          </motion.div>

          <motion.div key={`t-${shown(KNOWLEDGE_AT.task)}`} {...appear(shown(KNOWLEDGE_AT.task))}>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <InsightLabel type="task" />
                <TaskStatus status="todo" />
              </div>
              <p className="text-small font-medium text-foreground">Update the release plan</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-3">
                <Assignee name={DEMO_PEOPLE.daniel} />
                <DueDate date={DEMO_FRIDAY} />
                <PriorityBadge priority="high" />
              </div>
            </Card>
          </motion.div>

          <motion.div key={`q-${shown(KNOWLEDGE_AT.question)}`} {...appear(shown(KNOWLEDGE_AT.question))}>
            <Card className="flex flex-col gap-3 p-4">
              <InsightLabel type="risk" />
              <p className="text-small font-medium text-foreground">Migration window is the open risk.</p>
              <div className="flex items-center gap-2 border-t border-border-subtle pt-3">
                <span className="text-caption text-subtle-foreground">Raised by {DEMO_PEOPLE.maya} · linked to</span>
                <ProjectChip name="Public Launch" />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  )
}
