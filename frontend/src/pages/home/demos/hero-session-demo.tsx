import { AnimatePresence, motion } from 'framer-motion'
import { RecordingIndicator } from '@/components/recall/recording-indicator'
import { SessionStatus } from '@/components/recall/session-status'
import { InsightLabel } from '@/components/recall/insight-label'
import { TimestampLink } from '@/components/recall/timestamp-link'
import { TaskStatus } from '@/components/recall/task-status'
import { DecisionStatus } from '@/components/recall/decision-status'
import { Assignee } from '@/components/recall/assignee'
import { DueDate } from '@/components/recall/due-date'
import { ConfidenceIndicator } from '@/components/recall/confidence-indicator'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { cn } from '@/lib/utils'
import { DemoFrame } from './demo-frame'
import { useDemoTimeline } from './use-demo-timeline'
import { DEMO_TRANSCRIPT, DEMO_FRIDAY, DEMO_PEOPLE } from './demo-data'

const EASE = [0.16, 1, 0.3, 1] as const

// Sequence (ms). Record → live transcript + live detections → processing → structured knowledge.
const REC_END = 6200
const READY = 7100
const DURATION = 9800

const DETECTIONS: { at: number; type: 'decision' | 'task' | 'risk'; text: string }[] = [
  { at: 2600, type: 'decision', text: 'Launch → September 18' },
  { at: 3000, type: 'task', text: 'Daniel · update release plan' },
  { at: 4300, type: 'risk', text: 'Migration window' },
]

type Phase = 'recording' | 'processing' | 'ready'

/**
 * The hero's living product window: a real Recall session that records itself, streams a transcript,
 * flags decisions/tasks/risks live, processes, and resolves into structured knowledge — then loops.
 * Built entirely from the app's own components + tokens; drives off the shared demo timeline so it
 * pauses off-screen and shows its finished state under reduced-motion.
 */
export function HeroSessionDemo() {
  const { ref, elapsed, reduced } = useDemoTimeline({ duration: DURATION })

  const phase: Phase = elapsed >= READY ? 'ready' : elapsed >= REC_END ? 'processing' : 'recording'
  const firedLines = DEMO_TRANSCRIPT.filter((l) => elapsed >= l.at)
  const clock = firedLines.length ? firedLines[firedLines.length - 1].time : '00:00'
  const processPct =
    phase === 'ready' ? 100 : Math.round(Math.min(1, Math.max(0, (elapsed - REC_END) / (READY - REC_END))) * 100)

  // Entrance props that collapse to an instant cut under reduced-motion.
  const appear = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 8, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.4, ease: EASE, delay },
        }

  return (
    <div ref={ref}>
      <DemoFrame
        title="Product Launch Review"
        topbar={
          <>
            {phase === 'recording' ? (
              <RecordingIndicator state="recording" className="hidden sm:inline-flex" />
            ) : phase === 'processing' ? (
              <RecordingIndicator state="processing" className="hidden sm:inline-flex" />
            ) : null}
            <span className="font-mono text-caption tabular-nums text-subtle-foreground">{clock}</span>
            <SessionStatus status={phase === 'recording' ? 'recording' : phase === 'processing' ? 'processing' : 'ready'} />
          </>
        }
      >
        <div className="grid gap-px bg-border-subtle sm:grid-cols-2">
          {/* Left — live transcript */}
          <div className="min-h-[300px] bg-bg p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-caption font-medium uppercase tracking-wide text-subtle-foreground">
              Transcript
            </div>
            <div className="flex flex-col gap-3.5">
              {firedLines.map((line) => (
                <motion.div key={line.time} {...appear()} className="flex gap-2.5">
                  <TimestampLink time={line.time} active={line.accent} />
                  <div className="min-w-0">
                    <span className="text-small font-semibold text-foreground">{line.speaker}</span>
                    <p className={cn('text-small', line.accent ? 'text-foreground' : 'text-muted-foreground')}>{line.text}</p>
                  </div>
                </motion.div>
              ))}
              {phase === 'recording' && !reduced && (
                <span className="ml-11 inline-block h-3.5 w-2 animate-pulse rounded-[1px] bg-accent align-middle" aria-hidden />
              )}
            </div>
          </div>

          {/* Right — knowledge, evolving with the phase */}
          <div className="min-h-[300px] bg-bg p-4 sm:p-5">
            <AnimatePresence mode="wait">
              {phase === 'recording' && (
                <motion.div key="detecting" exit={reduced ? undefined : { opacity: 0 }} className="flex flex-col gap-2.5">
                  <div className="mb-0.5 text-caption font-medium uppercase tracking-wide text-subtle-foreground">Detecting</div>
                  {DETECTIONS.filter((d) => elapsed >= d.at).map((d) => (
                    <motion.div
                      key={d.type}
                      {...appear()}
                      className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2"
                    >
                      <InsightLabel type={d.type} />
                      <span className="truncate text-small text-muted-foreground">{d.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {phase === 'processing' && (
                <motion.div
                  key="processing"
                  initial={reduced ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  className="flex h-full flex-col justify-center gap-3 py-8"
                >
                  <span className="text-small font-medium text-foreground">Processing meeting…</span>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-surface-selected">
                    <div className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out" style={{ width: `${processPct}%` }} />
                  </div>
                  <span className="text-caption text-subtle-foreground">Summarizing · extracting tasks, decisions & risks</span>
                </motion.div>
              )}

              {phase === 'ready' && (
                <motion.div key="ready" className="flex flex-col gap-2.5">
                  <motion.p {...appear(0)} className="text-small leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Summary · </span>
                    The team moved the launch to September 18. Daniel owns the release-plan update; the migration window
                    is the open risk.
                  </motion.p>

                  <motion.div {...appear(0.08)} className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3">
                    <div className="flex items-center justify-between gap-2">
                      <InsightLabel type="decision" />
                      <DecisionStatus status="approved" />
                    </div>
                    <p className="text-small font-medium text-foreground">Launch moves to September 18.</p>
                    <div className="flex items-center gap-2 border-t border-border-subtle pt-2">
                      <ConfidenceIndicator value={96} />
                    </div>
                  </motion.div>

                  <motion.div {...appear(0.16)} className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-3">
                    <div className="flex items-center justify-between gap-2">
                      <InsightLabel type="task" />
                      <TaskStatus status="todo" />
                    </div>
                    <p className="text-small font-medium text-foreground">Update the release plan</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border-subtle pt-2">
                      <Assignee name={DEMO_PEOPLE.daniel} />
                      <DueDate date={DEMO_FRIDAY} />
                      <PriorityBadge priority="high" />
                    </div>
                  </motion.div>

                  <motion.div {...appear(0.24)} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-raised px-3 py-2.5">
                    <InsightLabel type="risk" />
                    <span className="truncate text-small text-muted-foreground">Migration window — raised by {DEMO_PEOPLE.maya}</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DemoFrame>
    </div>
  )
}
