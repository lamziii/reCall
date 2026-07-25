import { SessionStatus } from '@/components/recall/session-status'
import { RecordingIndicator } from '@/components/recall/recording-indicator'
import { ConfidenceIndicator } from '@/components/recall/confidence-indicator'
import { DecisionStatus } from '@/components/recall/decision-status'
import { TaskStatus } from '@/components/recall/task-status'
import { InsightLabel } from '@/components/recall/insight-label'
import { TimestampLink } from '@/components/recall/timestamp-link'
import { ProjectChip } from '@/components/recall/project-chip'
import { SessionMetadata } from '@/components/recall/session-metadata'
import { TranscriptSpeaker } from '@/components/recall/transcript-speaker'
import { Mention } from '@/components/recall/mention'
import { EntityLink } from '@/components/recall/entity-link'
import { DueDate } from '@/components/recall/due-date'
import { Assignee } from '@/components/recall/assignee'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)
const nextWeek = new Date(today)
nextWeek.setDate(today.getDate() + 7)

export function RecallSection() {
  return (
    <PlaygroundSection
      id="recall"
      title="Recall components"
      description="Domain-specific compositions built entirely on the primitives above — no new visual language, just Recall's vocabulary applied to StatusBadge, Avatar, and friends."
    >
      <PlaygroundRow label="SessionStatus">
        <SessionStatus status="scheduled" />
        <SessionStatus status="recording" />
        <SessionStatus status="paused" />
        <SessionStatus status="processing" />
        <SessionStatus status="ready" />
        <SessionStatus status="needs-review" />
        <SessionStatus status="archived" />
        <SessionStatus status="failed" />
      </PlaygroundRow>

      <PlaygroundRow label="RecordingIndicator">
        <RecordingIndicator state="idle" />
        <RecordingIndicator state="recording" />
        <RecordingIndicator state="paused" />
        <RecordingIndicator state="processing" />
      </PlaygroundRow>

      <PlaygroundRow label="ConfidenceIndicator">
        <ConfidenceIndicator value={94} />
        <ConfidenceIndicator value={61} />
        <ConfidenceIndicator value={28} />
        <ConfidenceIndicator value={87} variant="detailed" />
      </PlaygroundRow>

      <PlaygroundRow label="DecisionStatus">
        <DecisionStatus status="proposed" />
        <DecisionStatus status="pending-review" />
        <DecisionStatus status="approved" />
        <DecisionStatus status="rejected" />
        <DecisionStatus status="superseded" />
      </PlaygroundRow>

      <PlaygroundRow label="TaskStatus">
        <TaskStatus status="backlog" />
        <TaskStatus status="todo" />
        <TaskStatus status="in-progress" />
        <TaskStatus status="blocked" />
        <TaskStatus status="done" />
        <TaskStatus status="canceled" />
      </PlaygroundRow>

      <PlaygroundRow label="InsightLabel">
        <InsightLabel type="insight" />
        <InsightLabel type="risk" />
        <InsightLabel type="question" />
        <InsightLabel type="decision" />
        <InsightLabel type="task" />
        <InsightLabel type="document" />
        <InsightLabel type="person" />
        <InsightLabel type="project" />
      </PlaygroundRow>

      <PlaygroundRow label="TimestampLink">
        <TimestampLink time="00:12" />
        <TimestampLink time="09:41" active />
        <TimestampLink time="24:03" />
      </PlaygroundRow>

      <PlaygroundRow label="ProjectChip">
        <ProjectChip name="Apollo Launch" />
        <ProjectChip name="Onboarding Redesign" onClick={() => {}} selected />
        <ProjectChip name="Pricing Model Review" removable onRemove={() => {}} />
      </PlaygroundRow>

      <PlaygroundRow label="DueDate">
        <DueDate date={yesterday} />
        <DueDate date={today} />
        <DueDate date={tomorrow} />
        <DueDate date={nextWeek} />
        <DueDate />
      </PlaygroundRow>

      <PlaygroundRow label="Assignee">
        <Assignee name="Sarah Chen" />
        <Assignee name="Marcus Webb" compact />
        <Assignee />
      </PlaygroundRow>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">SessionMetadata</span>
        <SessionMetadata date="Jul 24, 2026" duration="42 min" project="Apollo Launch" participantCount={6} status="ready" />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">Mention, EntityLink (inline references)</span>
        <p className="max-w-xl text-small text-foreground">
          <Mention type="person" onClick={() => {}}>Sarah Chen</Mention> flagged this as blocking{' '}
          <Mention type="task" onClick={() => {}}>Ship v2 onboarding</Mention>. See the related discussion in{' '}
          <EntityLink type="session" onClick={() => {}}>Q3 Product Strategy Sync</EntityLink>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium uppercase tracking-wide text-subtle-foreground">TranscriptSpeaker</span>
        <div className="flex max-w-xl flex-col gap-1 rounded-xl border border-border bg-surface p-2">
          <TranscriptSpeaker name="Sarah Chen" timestamp="00:12" confidence={96} onTimestampClick={() => {}}>
            Let&apos;s start with the <Mention type="project" onClick={() => {}}>Apollo Launch</Mention> timeline — are we still on
            track for the Friday review?
          </TranscriptSpeaker>
          <TranscriptSpeaker name="Marcus Webb" timestamp="00:41" confidence={58} active onTimestampClick={() => {}}>
            Mostly, but I want to flag a risk around the onboarding copy review before we commit to a date.
          </TranscriptSpeaker>
        </div>
      </div>
    </PlaygroundSection>
  )
}
