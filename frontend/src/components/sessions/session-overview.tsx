import { FileText } from 'lucide-react'
import { Divider } from '@/components/data-display/divider'
import { Timeline, TimelineItem } from '@/components/data-display/timeline'
import { TimestampLink } from '@/components/recall/timestamp-link'
import { InsightLabel } from '@/components/recall/insight-label'
import { QuestionList } from '@/components/recall/question-list'
import { Avatar } from '@/components/data-display/avatar'
import { Body, Caption, H3, Small } from '@/components/typography'
import { EmptyState } from '@/components/feedback/empty-state'
import { DecisionList } from './decision-list'
import { SessionTaskList } from './session-task-list'
import type { SessionDetailData, SessionTimelineItem } from '@/data/sessions/types'
import type { TaskStatusValue } from '@/components/recall/task-status'

export interface SessionOverviewProps {
  session: SessionDetailData
  onApproveDecision: (id: string) => void
  onRejectDecision: (id: string) => void
  onTaskStatusChange: (id: string, status: TaskStatusValue) => void
  onTimelineClick: (item: SessionTimelineItem) => void
}

export function SessionOverview({ session, onApproveDecision, onRejectDecision, onTaskStatusChange, onTimelineClick }: SessionOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[64fr_36fr]">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <H3>Executive summary</H3>
            <Caption className="text-subtle-foreground">AI-generated summary</Caption>
          </div>
          <Body className="max-w-[65ch] leading-relaxed text-foreground">{session.summary}</Body>
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Key decisions</H3>
          <DecisionList decisions={session.decisions} onApprove={onApproveDecision} onReject={onRejectDecision} />
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Tasks</H3>
          <SessionTaskList tasks={session.tasks} onStatusChange={onTaskStatusChange} />
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Open questions</H3>
          <QuestionList questions={session.questions} />
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <H3>Participants</H3>
          <div className="flex flex-col gap-2">
            {session.participants.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <Avatar name={p.name} size="sm" />
                <Small className="text-foreground">{p.name}</Small>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Timeline</H3>
          <Timeline>
            {session.timeline.map((item, index) => (
              <TimelineItem
                key={item.id}
                time={<TimestampLink time={item.timestampLabel} onClick={() => onTimelineClick(item)} />}
                title={item.label}
                isLast={index === session.timeline.length - 1}
              />
            ))}
          </Timeline>
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Risks &amp; insights</H3>
          {session.risks.length === 0 && session.insights.length === 0 ? (
            <EmptyState title="No risks or insights flagged" className="py-6" />
          ) : (
            <div className="flex flex-col gap-3">
              {session.risks.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <InsightLabel type="risk" />
                  <div className="flex flex-col gap-0.5">
                    <Small className="text-foreground">{r.title}</Small>
                    <Caption className="text-subtle-foreground">{[r.ownerName, r.projectName].filter(Boolean).join(' · ')}</Caption>
                  </div>
                </div>
              ))}
              {session.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2">
                  <InsightLabel type="insight" />
                  <Small className="text-foreground">{insight}</Small>
                </div>
              ))}
            </div>
          )}
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Referenced documents</H3>
          <EmptyState icon={<FileText />} title="No documents referenced" description="Files shared during this session will appear here." className="py-6" />
        </section>
      </div>
    </div>
  )
}
