// Live (Firestore) aggregation for the Home dashboard and Calendar — built purely from the real
// `sessions` + `tasks` snapshots, no sample data. Produces the exact HomeDashboardData /
// CalendarMonthData shapes the existing Home/Calendar components already render, so the pages get
// real connected data with no UI rewrite. Pure functions → unit-testable (see mappers.test.ts).
import type {
  ActivityFeedItem,
  AttentionItem,
  HomeDashboardData,
  PrimaryAttention,
  PrimaryAttentionSession,
  SessionSummary,
} from '@/data/home/types'
import type { CalendarDay, CalendarDeadlineItem, CalendarListItem, CalendarMonthData, CalendarSessionPill } from '@/data/calendar/types'
import { formatDateLabel, formatDueLabel, formatFullDateTime, formatRelativeTime, formatTimeLabel } from '@/data/home/format'
import type { LiveSessionDoc, LiveTaskDoc } from './types'
import { liveSessionStatus, sessionDurationMinutes, tsToIso } from './mappers'

const sessionHref = (id: string) => `/app/sessions/${id}`
const taskHref = (id: string) => `/app/tasks?task=${id}`

const createdMs = (s: LiveSessionDoc) => new Date(tsToIso(s.created_at)).getTime()
const isOpen = (t: LiveTaskDoc) => t.status !== 'done'
const dueMs = (t: LiveTaskDoc) => (t.deadline ? new Date(t.deadline).getTime() : Number.POSITIVE_INFINITY)
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** Where a session is placed on the calendar: a scheduled meeting's start time, otherwise when it
 *  was recorded. */
const sessionDisplayIso = (s: LiveSessionDoc) => tsToIso(s.scheduled_at ?? s.created_at)
const isScheduled = (s: LiveSessionDoc) => s.status === 'scheduled'

function durationLabel(s: LiveSessionDoc): string {
  const mins = sessionDurationMinutes(s)
  return mins ? `${mins} min` : ''
}

function buildPrimarySession(s: LiveSessionDoc, reason: PrimaryAttentionSession['reason'], openTasksForSession: number): PrimaryAttentionSession {
  const iso = tsToIso(s.created_at)
  return {
    kind: 'session',
    reason,
    id: s.id,
    title: s.title?.trim() || 'Untitled session',
    status: liveSessionStatus(s),
    projectName: s.project_name ?? undefined,
    dateLabel: formatDateLabel(iso),
    durationLabel: durationLabel(s),
    participantNames: s.participants ?? [],
    summary: s.review_summary?.trim() || s.notes?.trim() || '',
    decisionsAwaitingReview: s.decisions_count ?? 0,
    openTasks: openTasksForSession,
    href: sessionHref(s.id),
    transcriptHref: `${sessionHref(s.id)}?tab=transcript`,
  }
}

export function toLiveHomeData(
  sessions: LiveSessionDoc[],
  tasks: LiveTaskDoc[],
  ctx: { userName: string; workspaceName: string },
): HomeDashboardData {
  const recent = [...sessions].sort((a, b) => createdMs(b) - createdMs(a))
  const openTasks = tasks.filter(isOpen)
  const openBySession = new Map<string, number>()
  for (const t of openTasks) if (t.session_id) openBySession.set(t.session_id, (openBySession.get(t.session_id) ?? 0) + 1)

  const needsAttention: AttentionItem[] = [...openTasks]
    .filter((t) => t.deadline || t.priority === 'red')
    .sort((a, b) => dueMs(a) - dueMs(b) || (a.priority === 'red' ? -1 : 1))
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      type: 'task',
      title: t.title,
      ownerName: t.owner && t.owner !== 'Unassigned' ? t.owner : undefined,
      dueLabel: formatDueLabel(t.deadline ?? undefined),
      sourceSessionTitle: t.source_session_title ?? undefined,
      href: taskHref(t.id),
    }))

  const recentSessions: SessionSummary[] = recent.slice(0, 5).map((s) => ({
    id: s.id,
    title: s.title?.trim() || 'Untitled session',
    projectName: s.project_name ?? undefined,
    participantNames: s.participants ?? [],
    dateLabel: formatDateLabel(tsToIso(s.created_at)),
    durationLabel: durationLabel(s),
    status: liveSessionStatus(s),
    summaryPreview: s.review_summary?.trim() || s.notes?.trim() || 'Open the AI session review',
    href: sessionHref(s.id),
  }))

  const recentActivity: ActivityFeedItem[] = recent.slice(0, 6).map((s) => {
    const iso = tsToIso(s.updated_at ?? s.created_at)
    const status = liveSessionStatus(s)
    const verb = status === 'ready' ? 'organized' : status === 'failed' ? 'could not finish processing' : 'is processing'
    return {
      id: `act-${s.id}`,
      sentence: `Recall ${verb} “${s.title?.trim() || 'Untitled session'}”.`,
      href: sessionHref(s.id),
      relativeTimeLabel: formatRelativeTime(iso),
      fullTimestampLabel: formatFullDateTime(iso),
    }
  })

  // Priority: a processing session, then a failed one, then the most overdue task, then the latest.
  const processing = recent.find((s) => liveSessionStatus(s) === 'processing')
  const failed = recent.find((s) => liveSessionStatus(s) === 'failed')
  const overdue = [...openTasks].filter((t) => t.deadline && new Date(t.deadline).getTime() < Date.now()).sort((a, b) => dueMs(a) - dueMs(b))[0]
  let primaryAttention: PrimaryAttention | null = null
  if (processing) primaryAttention = buildPrimarySession(processing, 'processing', openBySession.get(processing.id) ?? 0)
  else if (failed) primaryAttention = buildPrimarySession(failed, 'needs-review', openBySession.get(failed.id) ?? 0)
  else if (overdue) {
    primaryAttention = {
      kind: 'task',
      reason: 'overdue-task',
      id: overdue.id,
      title: overdue.title,
      projectName: undefined,
      dueLabel: formatDueLabel(overdue.deadline ?? undefined) ?? 'Overdue',
      href: taskHref(overdue.id),
    }
  } else if (recent[0]) primaryAttention = buildPrimarySession(recent[0], 'recent-session', openBySession.get(recent[0].id) ?? 0)

  return {
    greeting: { userName: ctx.userName, workspaceName: ctx.workspaceName, dateLabel: formatFullDateTime(new Date().toISOString()) },
    primaryAttention,
    todaySchedule: [], // no forward-scheduled meetings in the recording flow yet
    needsAttention,
    recentSessions,
    activeProjects: [], // Projects intentionally out of scope this phase
    recentActivity,
  }
}

// ---- Calendar ----------------------------------------------------------------

function sessionPill(s: LiveSessionDoc): CalendarSessionPill {
  return { id: s.id, title: s.title?.trim() || 'Untitled session', timeLabel: formatTimeLabel(sessionDisplayIso(s)), status: liveSessionStatus(s) }
}
function deadlinePill(t: LiveTaskDoc): CalendarSessionPill {
  return { id: `task-${t.id}`, title: t.title, timeLabel: 'Due', status: 'scheduled' }
}

/** Builds the month grid + side lists from real sessions and dated tasks. */
export function toLiveCalendarData(sessions: LiveSessionDoc[], tasks: LiveTaskDoc[], year: number, month: number): CalendarMonthData {
  const first = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - first.getDay()) // back up to the Sunday of the first row
  const today = new Date()

  const days: CalendarDay[] = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const sessionPills = sessions.filter((s) => isSameDay(new Date(sessionDisplayIso(s)), date)).map(sessionPill)
    const deadlinePills = tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), date) && isOpen(t)).map(deadlinePill)
    return {
      dateIso: date.toISOString(),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
      sessions: [...sessionPills, ...deadlinePills],
    }
  })

  const listItem = (s: LiveSessionDoc): CalendarListItem => ({
    id: s.id,
    title: s.title?.trim() || 'Untitled session',
    dateLabel: formatDateLabel(sessionDisplayIso(s)),
    timeLabel: formatTimeLabel(sessionDisplayIso(s)),
    projectName: s.project_name ?? undefined,
  })

  const todaysAgenda: CalendarListItem[] = sessions
    .filter((s) => isSameDay(new Date(sessionDisplayIso(s)), today))
    .map(listItem)
    .concat(
      tasks
        .filter((t) => t.deadline && isSameDay(new Date(t.deadline), today) && isOpen(t))
        .map((t) => ({ id: `task-${t.id}`, title: t.title, dateLabel: 'Today', timeLabel: 'Due', projectName: undefined })),
    )

  const upcomingMeetings: CalendarListItem[] = sessions
    .filter((s) => isScheduled(s) && new Date(sessionDisplayIso(s)).getTime() > Date.now())
    .sort((a, b) => new Date(sessionDisplayIso(a)).getTime() - new Date(sessionDisplayIso(b)).getTime())
    .slice(0, 6)
    .map(listItem)

  const upcomingDeadlines: CalendarDeadlineItem[] = [...tasks]
    .filter((t) => t.deadline && isOpen(t))
    .sort((a, b) => dueMs(a) - dueMs(b))
    .slice(0, 8)
    .map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      dueDateLabel: formatDueLabel(t.deadline ?? undefined) ?? '',
      isOverdue: !!t.deadline && new Date(t.deadline).getTime() < Date.now(),
    }))

  const recentSessions: CalendarListItem[] = [...sessions]
    .filter((s) => !isScheduled(s))
    .sort((a, b) => createdMs(b) - createdMs(a))
    .slice(0, 6)
    .map(listItem)

  return {
    monthLabel: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    days,
    upcomingMeetings,
    todaysAgenda,
    upcomingDeadlines,
    recentSessions,
  }
}
