import { FileText, Mic } from 'lucide-react'
import { Divider } from '@/components/data-display/divider'
import { List } from '@/components/data-display/list'
import { Avatar } from '@/components/data-display/avatar'
import { Timeline, TimelineItem } from '@/components/data-display/timeline'
import { Body, Caption, H3, Small } from '@/components/typography'
import { EmptyState } from '@/components/feedback/empty-state'
import { QuestionList } from '@/components/recall/question-list'
import { DecisionList, SessionRow, SessionTaskList } from '@/components/sessions'
import type { ProjectDetailData } from '@/data/projects/types'
import type { TaskStatusValue } from '@/components/recall/task-status'

export interface ProjectOverviewProps {
  project: ProjectDetailData
  onApproveDecision: (id: string) => void
  onRejectDecision: (id: string) => void
  onTaskStatusChange: (id: string, status: TaskStatusValue) => void
}

export function ProjectOverview({ project, onApproveDecision, onRejectDecision, onTaskStatusChange }: ProjectOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[64fr_36fr]">
      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <H3>AI summary</H3>
            <Caption className="text-subtle-foreground">AI-generated summary</Caption>
          </div>
          <Body className="max-w-[65ch] leading-relaxed text-foreground">{project.aiSummary}</Body>
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Sessions</H3>
          {project.sessions.length === 0 ? (
            <EmptyState icon={<Mic />} title="No sessions yet" description="Sessions recorded for this project will appear here." className="py-8" />
          ) : (
            <List>
              {project.sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </List>
          )}
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Recent decisions</H3>
          <DecisionList decisions={project.decisions} onApprove={onApproveDecision} onReject={onRejectDecision} />
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Tasks</H3>
          <SessionTaskList tasks={project.tasks} onStatusChange={onTaskStatusChange} />
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Open questions</H3>
          <QuestionList questions={project.questions} />
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <H3>Participants</H3>
          <div className="flex flex-col gap-2">
            {project.members.map((m) => (
              <div key={m.name} className="flex items-center gap-2">
                <Avatar name={m.name} size="sm" />
                <span className="flex flex-col leading-tight">
                  <Small className="text-foreground">
                    {m.name}
                    {m.isOwner && <span className="text-subtle-foreground"> · Owner</span>}
                  </Small>
                  <Caption className="text-subtle-foreground">{m.role}</Caption>
                </span>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Timeline</H3>
          {project.timeline.length === 0 ? (
            <EmptyState title="No activity yet" className="py-6" />
          ) : (
            <Timeline>
              {project.timeline.slice(0, 6).map((item, index, arr) => (
                <TimelineItem key={item.id} time={item.timestampLabel} title={item.label} description={item.detail} isLast={index === arr.length - 1} />
              ))}
            </Timeline>
          )}
        </section>

        <Divider />

        <section className="flex flex-col gap-3">
          <H3>Documents</H3>
          <EmptyState icon={<FileText />} title="No documents yet" description="Files shared in this project will appear here." className="py-6" />
        </section>
      </div>
    </div>
  )
}
