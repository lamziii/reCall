import { getWorkspaceData } from '../workspace-repository'
import type { ActivityItem, Person, Project, SessionRecord, WorkspaceData } from '../types'
import type {
  ActivityFeedItem,
  AttentionItem,
  HomeDashboardData,
  PrimaryAttention,
  ProjectSummary,
  ScheduledSession,
  SessionSummary,
} from './types'
import { formatDateLabel, formatDueLabel, formatDuration, formatFullDateTime, formatRelativeTime, formatTimeLabel, greetingForHour } from './format'
import { isToday, isPast } from '../sample/date-helpers'

function personName(people: Person[], id?: string): string | undefined {
  return id ? people.find((p) => p.id === id)?.name : undefined
}

function projectName(projects: Project[], id?: string): string | undefined {
  return id ? projects.find((p) => p.id === id)?.name : undefined
}

function sessionTitle(sessions: SessionRecord[], id?: string): string | undefined {
  return id ? sessions.find((s) => s.id === id)?.title : undefined
}

const sessionHref = (id: string) => `/app/sessions/${id}`
const transcriptHref = (id: string) => `/app/sessions/${id}?tab=transcript`
const taskHref = (id: string) => `/app/tasks?task=${id}`
const projectHref = (id: string) => `/app/projects?project=${id}`

function buildPrimaryAttention(data: WorkspaceData): PrimaryAttention | null {
  const { sessions, tasks, people, projects, decisions } = data

  const processingToday = sessions.find((s) => s.status === 'processing' && isToday(s.date))
  const needsReview = sessions
    .filter((s) => s.status === 'needs-review')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  const overdueUrgentTask = tasks
    .filter((t) => t.status !== 'done' && t.dueDate && isPast(t.dueDate) && t.priority === 'urgent')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]
  const upcomingSoon = sessions
    .filter((s) => s.status === 'scheduled' && new Date(s.date).getTime() - Date.now() < 2 * 60 * 60 * 1000 && new Date(s.date).getTime() > Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
  const mostRecent = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  const winner = processingToday ? { session: processingToday, reason: 'processing' as const }
    : needsReview ? { session: needsReview, reason: 'needs-review' as const }
    : null

  if (winner) {
    const { session, reason } = winner
    return {
      kind: 'session',
      reason,
      id: session.id,
      title: session.title,
      status: session.status,
      projectName: projectName(projects, session.projectId),
      dateLabel: formatDateLabel(session.date),
      durationLabel: formatDuration(session.durationMinutes),
      participantNames: session.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n)),
      summary: session.summary,
      decisionsAwaitingReview: decisions.filter((d) => d.sourceSessionId === session.id && d.status === 'pending-review').length,
      openTasks: tasks.filter((t) => t.sourceSessionId === session.id && t.status !== 'done').length,
      href: sessionHref(session.id),
      transcriptHref: transcriptHref(session.id),
    }
  }

  if (overdueUrgentTask) {
    return {
      kind: 'task',
      reason: 'overdue-task',
      id: overdueUrgentTask.id,
      title: overdueUrgentTask.title,
      projectName: projectName(projects, overdueUrgentTask.projectId),
      dueLabel: formatDueLabel(overdueUrgentTask.dueDate) ?? 'Overdue',
      href: taskHref(overdueUrgentTask.id),
    }
  }

  const fallbackSession = upcomingSoon ?? mostRecent
  if (!fallbackSession) return null

  return {
    kind: 'session',
    reason: upcomingSoon ? 'upcoming-meeting' : 'recent-session',
    id: fallbackSession.id,
    title: fallbackSession.title,
    status: fallbackSession.status,
    projectName: projectName(projects, fallbackSession.projectId),
    dateLabel: formatDateLabel(fallbackSession.date),
    durationLabel: formatDuration(fallbackSession.durationMinutes),
    participantNames: fallbackSession.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n)),
    summary: fallbackSession.summary,
    decisionsAwaitingReview: decisions.filter((d) => d.sourceSessionId === fallbackSession.id && d.status === 'pending-review').length,
    openTasks: tasks.filter((t) => t.sourceSessionId === fallbackSession.id && t.status !== 'done').length,
    href: sessionHref(fallbackSession.id),
    transcriptHref: transcriptHref(fallbackSession.id),
  }
}

function buildTodaySchedule(data: WorkspaceData): ScheduledSession[] {
  const { sessions, people, projects } = data
  return sessions
    .filter((s) => isToday(s.date) && (s.status === 'scheduled' || s.status === 'recording'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      id: s.id,
      title: s.title,
      timeLabel: formatTimeLabel(s.date),
      fullDateTimeLabel: formatFullDateTime(s.date),
      projectName: projectName(projects, s.projectId),
      participantNames: s.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n)),
      status: s.status,
      href: sessionHref(s.id),
    }))
}

type RankedAttentionItem = AttentionItem & { _rank: number; _time: number }

function buildNeedsAttention(data: WorkspaceData): AttentionItem[] {
  const { decisions, tasks, questions, risks, people, projects, sessions } = data

  const items: RankedAttentionItem[] = [
    ...decisions
      .filter((d) => d.status === 'pending-review' || d.status === 'proposed')
      .map((d) => ({
        id: d.id,
        type: 'decision' as const,
        title: d.title,
        projectName: projectName(projects, d.projectId),
        ownerName: personName(people, d.ownerId),
        sourceSessionTitle: sessionTitle(sessions, d.sourceSessionId),
        href: sessionHref(d.sourceSessionId ?? ''),
        _rank: d.status === 'pending-review' ? 0 : 1,
        _time: new Date(d.createdAt).getTime(),
      })),
    ...tasks
      .filter((t) => t.status !== 'done' && (t.status === 'blocked' || (t.dueDate && (isPast(t.dueDate) || isToday(t.dueDate)))))
      .map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        projectName: projectName(projects, t.projectId),
        ownerName: personName(people, t.assigneeId),
        dueLabel: t.status === 'blocked' ? 'Blocked' : formatDueLabel(t.dueDate),
        sourceSessionTitle: sessionTitle(sessions, t.sourceSessionId),
        href: taskHref(t.id),
        _rank: t.status === 'blocked' ? 0 : t.priority === 'urgent' ? 0 : 1,
        _time: t.dueDate ? new Date(t.dueDate).getTime() : 0,
      })),
    ...questions
      .filter((q) => q.status === 'open')
      .map((q) => ({
        id: q.id,
        type: 'question' as const,
        title: q.title,
        projectName: projectName(projects, q.projectId),
        ownerName: personName(people, q.ownerId),
        sourceSessionTitle: sessionTitle(sessions, q.sourceSessionId),
        href: sessionHref(q.sourceSessionId ?? ''),
        _rank: q.severity === 'high' ? 0 : 1,
        _time: new Date(q.createdAt).getTime(),
      })),
    ...risks
      .filter((r) => r.status === 'open')
      .map((r) => ({
        id: r.id,
        type: 'risk' as const,
        title: r.title,
        projectName: projectName(projects, r.projectId),
        ownerName: personName(people, r.ownerId),
        sourceSessionTitle: sessionTitle(sessions, r.sourceSessionId),
        href: sessionHref(r.sourceSessionId ?? ''),
        _rank: r.severity === 'high' ? 0 : 1,
        _time: new Date(r.createdAt).getTime(),
      })),
  ]

  return items
    .sort((a, b) => a._rank - b._rank || b._time - a._time)
    .slice(0, 7)
    .map(({ _rank, _time, ...item }) => item)
}

function buildRecentSessions(data: WorkspaceData): SessionSummary[] {
  const { sessions, people, projects } = data
  return [...sessions]
    .filter((s) => s.status !== 'scheduled')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      title: s.title,
      projectName: projectName(projects, s.projectId),
      participantNames: s.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n)),
      dateLabel: formatDateLabel(s.date),
      durationLabel: formatDuration(s.durationMinutes),
      status: s.status,
      summaryPreview: s.summary,
      href: sessionHref(s.id),
    }))
}

function buildActiveProjects(data: WorkspaceData): ProjectSummary[] {
  const { projects, people, sessions } = data
  return projects
    .filter((p) => p.status !== 'done' && p.status !== 'archived' && p.status !== 'on-hold')
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 4)
    .map((p) => {
      const latest = sessions.filter((s) => s.projectId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      const milestone =
        p.status === 'at-risk'
          ? 'At risk of missing target date'
          : p.status === 'planning'
            ? 'In planning'
            : `On track for ${formatDateLabel(p.targetDate)}`
      return {
        id: p.id,
        name: p.name,
        ownerName: personName(people, p.ownerId) ?? 'Unassigned',
        status: p.status,
        targetDateLabel: formatDateLabel(p.targetDate),
        progressPct: p.progressPct,
        nextMilestoneLabel: milestone,
        latestSessionTitle: latest?.title,
        href: projectHref(p.id),
      }
    })
}

const SYSTEM_ACTIONS = new Set<ActivityItem['action']>(['extracted-tasks'])

function describeActivity(item: ActivityItem, actorName: string | undefined): string {
  switch (item.action) {
    case 'approved-decision':
      return `${actorName} approved a decision from ${item.entityLabel}.`
    case 'completed-task':
      return `${actorName} completed ${item.entityLabel}.`
    case 'extracted-tasks':
      return `Recall extracted three tasks from ${item.entityLabel}.`
    case 'updated-project':
      return `${actorName} updated the ${item.entityLabel} project.`
    case 'identified-risk':
      return `A new risk was identified in ${item.entityLabel}.`
    case 'created-session':
      return `${actorName} created ${item.entityLabel}.`
    default:
      return `${actorName ?? 'Recall'} updated ${item.entityLabel}.`
  }
}

function buildRecentActivity(data: WorkspaceData): ActivityFeedItem[] {
  const { activity, people } = data
  return [...activity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((a) => {
      const isSystem = SYSTEM_ACTIONS.has(a.action)
      const actorName = isSystem ? undefined : personName(people, a.actorId)
      const href =
        a.entityType === 'task'
          ? taskHref(a.entityId)
          : a.entityType === 'project'
            ? projectHref(a.entityId)
            : a.entityType === 'session'
              ? sessionHref(a.entityId)
              : sessionHref(
                  a.entityType === 'decision'
                    ? (data.decisions.find((d) => d.id === a.entityId)?.sourceSessionId ?? '')
                    : (data.risks.find((r) => r.id === a.entityId)?.sourceSessionId ?? ''),
                )
      return {
        id: a.id,
        actorName,
        sentence: describeActivity(a, actorName),
        href,
        relativeTimeLabel: formatRelativeTime(a.timestamp),
        fullTimestampLabel: formatFullDateTime(a.timestamp),
      }
    })
}

/** Returns null when there is no workspace data yet — callers should render the empty state. */
export function getHomeDashboardData(): HomeDashboardData | null {
  const data = getWorkspaceData()
  if (!data) return null

  const currentUser = data.people.find((p) => p.id === data.workspace.currentUserId)
  const now = new Date()

  return {
    greeting: {
      userName: currentUser?.name.split(' ')[0] ?? 'there',
      workspaceName: data.workspace.name,
      dateLabel: now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    },
    primaryAttention: buildPrimaryAttention(data),
    todaySchedule: buildTodaySchedule(data),
    needsAttention: buildNeedsAttention(data),
    recentSessions: buildRecentSessions(data),
    activeProjects: buildActiveProjects(data),
    recentActivity: buildRecentActivity(data),
  }
}

export { greetingForHour }
