import { getWorkspaceData, saveWorkspaceData } from '../workspace-repository'
import type { Person, Project, SessionRecord, WorkspaceData } from '../types'
import { formatDateLabel, formatDueLabel, formatDuration, formatFullDateTime, formatTimeLabel } from '../home/format'
import { generateTranscript } from './transcript'
import type {
  SessionDateGroup,
  SessionDecisionItem,
  SessionDetailData,
  SessionListItem,
  SessionQuestionItem,
  SessionRiskItem,
  SessionTaskItem,
  SessionTimelineItem,
  SessionsListData,
} from './types'
import type { DecisionStatusValue } from '@/components/recall/decision-status'
import type { TaskStatusValue } from '@/components/recall/task-status'

function personName(people: Person[], id?: string): string | undefined {
  return id ? people.find((p) => p.id === id)?.name : undefined
}

function projectName(projects: Project[], id?: string): string | undefined {
  return id ? projects.find((p) => p.id === id)?.name : undefined
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function dateGroup(iso: string): SessionDateGroup {
  const diffDays = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86_400_000)
  if (diffDays > 0) return 'upcoming'
  if (diffDays === 0) return 'today'
  if (diffDays === -1) return 'yesterday'
  if (diffDays >= -7) return 'this-week'
  return 'earlier'
}

export function getSessionsListData(): SessionsListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const { sessions, people, projects, decisions, tasks } = data

  const items: SessionListItem[] = sessions.map((s) => {
    const sessionDecisions = decisions.filter((d) => d.sourceSessionId === s.id)
    const sessionTasks = tasks.filter((t) => t.sourceSessionId === s.id)
    return {
      id: s.id,
      title: s.title,
      summaryPreview: s.summary,
      projectId: s.projectId,
      projectName: projectName(projects, s.projectId),
      participantNames: s.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n)),
      dateLabel: formatDateLabel(s.date),
      timeLabel: formatTimeLabel(s.date),
      durationLabel: formatDuration(s.durationMinutes),
      durationMinutes: s.durationMinutes,
      status: s.status,
      decisionsCount: sessionDecisions.length,
      tasksCount: sessionTasks.length,
      needsAttention: s.status === 'needs-review' || s.status === 'failed' || sessionDecisions.some((d) => d.status === 'pending-review'),
      rawDate: s.date,
      dateGroup: dateGroup(s.date),
    }
  })

  return { sessions: items, projectOptions: projects.map((p) => ({ id: p.id, name: p.name })) }
}

function buildTimeline(session: SessionRecord): SessionTimelineItem[] {
  const start = new Date(session.date)
  return session.timeline.map((event, index) => {
    const time = new Date(start.getTime() + event.offsetMinutes * 60_000)
    const lower = event.label.toLowerCase()
    const kind: SessionTimelineItem['kind'] =
      index === 0
        ? 'start'
        : index === session.timeline.length - 1
          ? 'end'
          : lower.includes('decision')
            ? 'decision'
            : lower.includes('action')
              ? 'task'
              : 'topic'
    return {
      id: `${session.id}-tl-${index}`,
      label: event.label,
      timestampLabel: formatTimeLabel(time.toISOString()),
      offsetMinutes: event.offsetMinutes,
      kind,
    }
  })
}

function buildDetail(session: SessionRecord, data: WorkspaceData): SessionDetailData {
  const { people, projects, decisions, tasks, questions, risks } = data
  const participantNames = session.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n))

  const sessionDecisions = decisions.filter((d) => d.sourceSessionId === session.id)
  const sessionTasks = tasks.filter((t) => t.sourceSessionId === session.id)
  const sessionQuestions = questions.filter((q) => q.sourceSessionId === session.id)
  const sessionRisks = risks.filter((r) => r.sourceSessionId === session.id)

  const decisionItems: SessionDecisionItem[] = sessionDecisions.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    ownerName: personName(people, d.ownerId),
    confidence: d.confidence,
    timestampLabel: formatFullDateTime(d.createdAt),
    projectName: projectName(projects, d.projectId),
    linkedTaskCount: d.linkedTaskIds.length,
  }))

  const taskItems: SessionTaskItem[] = sessionTasks.map((t) => ({
    id: t.id,
    title: t.title,
    assigneeName: personName(people, t.assigneeId),
    priority: t.priority,
    status: t.status,
    dueDateLabel: formatDueLabel(t.dueDate),
  }))

  const questionItems: SessionQuestionItem[] = sessionQuestions.map((q) => ({
    id: q.id,
    title: q.title,
    ownerName: personName(people, q.ownerId),
    projectName: projectName(projects, q.projectId),
    timestampLabel: formatFullDateTime(q.createdAt),
  }))

  const riskItems: SessionRiskItem[] = sessionRisks.map((r) => ({
    id: r.id,
    title: r.title,
    ownerName: personName(people, r.ownerId),
    projectName: projectName(projects, r.projectId),
    severity: r.severity,
  }))

  return {
    id: session.id,
    title: session.title,
    projectName: projectName(projects, session.projectId),
    dateLabel: formatDateLabel(session.date),
    fullDateTimeLabel: formatFullDateTime(session.date),
    durationLabel: formatDuration(session.durationMinutes),
    status: session.status,
    participants: participantNames.map((name) => ({ name })),
    summary: session.summary,
    decisions: decisionItems,
    tasks: taskItems,
    questions: questionItems,
    risks: riskItems,
    insights: session.insights,
    timeline: buildTimeline(session),
    transcript:
      session.transcript && session.transcript.length > 0
        ? session.transcript
        : generateTranscript(session, people, participantNames, sessionDecisions, sessionTasks, sessionQuestions),
    audio: session.audio,
  }
}

export function getSessionDetailData(sessionId: string): SessionDetailData | null | 'not-found' {
  const data = getWorkspaceData()
  if (!data) return null
  const session = data.sessions.find((s) => s.id === sessionId)
  if (!session) return 'not-found'
  return buildDetail(session, data)
}

export function setDecisionStatus(sessionId: string, decisionId: string, status: DecisionStatusValue): SessionDetailData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated: WorkspaceData = { ...data, decisions: data.decisions.map((d) => (d.id === decisionId ? { ...d, status } : d)) }
  saveWorkspaceData(updated)
  const session = updated.sessions.find((s) => s.id === sessionId)
  return session ? buildDetail(session, updated) : null
}

export function setTaskStatus(sessionId: string, taskId: string, status: TaskStatusValue): SessionDetailData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated: WorkspaceData = {
    ...data,
    tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : t.completedAt } : t)),
  }
  saveWorkspaceData(updated)
  const session = updated.sessions.find((s) => s.id === sessionId)
  return session ? buildDetail(session, updated) : null
}
