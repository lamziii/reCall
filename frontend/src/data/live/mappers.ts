import type { Timestamp } from 'firebase/firestore'
import type { CandidateTask, SessionReview } from './review'
import type { LiveSessionDoc, LiveTaskDoc, SessionReviewStatus } from './types'
import type { SessionDateGroup, SessionDetailData, SessionListItem, SessionsListData } from '@/data/sessions/types'
import type { TaskListItem, TasksListData } from '@/data/tasks/types'
import type { SessionStatusValue } from '@/components/recall/session-status'
import type { TaskStatusValue } from '@/components/recall/task-status'
import type { Priority } from '@/components/data-display/priority-badge'
import { formatDateLabel, formatDueLabel, formatFullDateTime, formatTimeLabel } from '@/data/home/format'

export function tsToIso(ts: Timestamp | null | undefined): string {
  try {
    return ts ? ts.toDate().toISOString() : new Date().toISOString()
  } catch {
    return new Date().toISOString()
  }
}

// Contract 2 priority (display color) -> the frontend's 4-level Priority for the badge.
export function priorityDbToView(p: LiveTaskDoc['priority']): Priority {
  return p === 'red' ? 'high' : p === 'amber' ? 'medium' : 'low'
}

// Contract 2 status (underscore) <-> the frontend's hyphenated TaskStatusValue.
export function statusDbToView(s: LiveTaskDoc['status']): TaskStatusValue {
  return s === 'in_progress' ? 'in-progress' : s
}
export function statusViewToDb(s: TaskStatusValue): LiveTaskDoc['status'] {
  if (s === 'in-progress') return 'in_progress'
  if (s === 'done') return 'done'
  return 'todo'
}

/**
 * Maps an AI review candidate to the Contract 2 board-task fields. Pure and defensive so it
 * can be unit-tested: enforces the priority enum, ISO-or-null deadline, "Unassigned" owner
 * default, and the initial "todo" status. Does NOT mutate the candidate.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
export function candidateToTaskInput(candidate: CandidateTask): {
  title: string
  owner: string
  deadline: string | null
  priority: LiveTaskDoc['priority']
  status: LiveTaskDoc['status']
} {
  const priority: LiveTaskDoc['priority'] =
    candidate.priority === 'red' || candidate.priority === 'amber' || candidate.priority === 'gray'
      ? candidate.priority
      : 'gray'
  const deadline = candidate.deadline && ISO_DATE.test(candidate.deadline) ? candidate.deadline : null
  const owner = candidate.owner && candidate.owner.trim() ? candidate.owner.trim() : 'Unassigned'
  return { title: candidate.title.trim(), owner, deadline, priority, status: 'todo' }
}

export function reviewStatusToSessionStatus(rs: SessionReviewStatus | undefined): SessionStatusValue {
  if (rs === 'processing') return 'processing'
  if (rs === 'failed') return 'failed'
  if (rs === 'completed') return 'ready'
  return 'ready'
}

/**
 * Minimal SessionDetailData for reusing <SessionHeader> in live mode. The Session Review page
 * renders topics/decisions/tasks/etc. from the live review doc directly, so those arrays stay
 * empty here — this only feeds the header (title, status, participants, project, date).
 */
export function toHeaderData(session: LiveSessionDoc, summary: string): SessionDetailData {
  const iso = tsToIso(session.created_at)
  return {
    id: session.id,
    title: session.title,
    projectName: session.project_name ?? undefined,
    dateLabel: formatDateLabel(iso),
    fullDateTimeLabel: formatFullDateTime(iso),
    durationLabel: '',
    status: reviewStatusToSessionStatus(session.review_status),
    participants: (session.participants ?? []).map((name) => ({ name })),
    summary,
    decisions: [],
    tasks: [],
    questions: [],
    risks: [],
    insights: [],
    timeline: [],
    transcript: [],
    audio: undefined,
  }
}

/**
 * Full SessionDetailData for the live Session Review page, so it can render the same polished
 * <SessionOverview> the demo uses (clear Decisions / Tasks / Open questions / Risks sections).
 * Decisions are mapped to 'approved' so no approve/reject buttons show (AI output isn't a workflow).
 */
export function liveReviewToDetailData(session: LiveSessionDoc, review: SessionReview): SessionDetailData {
  const base = toHeaderData(session, review.executive_summary)
  return {
    ...base,
    decisions: review.decisions.map((d, i) => ({
      id: `d${i}`,
      title: d.details ? `${d.decision} — ${d.details}` : d.decision,
      status: 'approved' as const,
      timestampLabel: '',
      linkedTaskCount: 0,
    })),
    tasks: review.tasks.map((t, i) => ({
      id: `t${i}`,
      title: t.title,
      assigneeName: t.owner ?? undefined,
      priority: priorityDbToView(t.priority),
      status: 'todo' as const,
      dueDateLabel: t.deadline ? formatDueLabel(t.deadline) : undefined,
    })),
    questions: review.questions.map((q, i) => ({
      id: `q${i}`,
      title: q.question,
      projectName: q.context ?? undefined,
      timestampLabel: '',
    })),
    risks: review.risks.map((r, i) => ({ id: `r${i}`, title: r.risk, severity: r.severity })),
    insights: review.insights,
    timeline: review.timeline.map((item, i) => ({
      id: `tl${i}`,
      label: item.label,
      timestampLabel: item.detail ?? '',
      offsetMinutes: i,
      kind: 'topic' as const,
    })),
  }
}

export function taskDocToListItem(task: LiveTaskDoc, sessionTitle?: string): TaskListItem {
  const overdue =
    !!task.deadline &&
    task.status !== 'done' &&
    new Date(task.deadline).getTime() < Date.now()
  return {
    id: task.id,
    title: task.title,
    projectId: task.project_id ?? undefined,
    projectName: undefined,
    assigneeId: task.owner && task.owner !== 'Unassigned' ? task.owner : undefined,
    assigneeName: task.owner && task.owner !== 'Unassigned' ? task.owner : undefined,
    priority: priorityDbToView(task.priority),
    status: statusDbToView(task.status),
    dueDateRaw: task.deadline ?? undefined,
    sourceSessionId: task.session_id ?? undefined,
    sessionTitle: sessionTitle ?? task.source_session_title ?? undefined,
    isOverdue: overdue,
  }
}

export function toTasksListData(tasks: LiveTaskDoc[], sessionTitles: Map<string, string>): TasksListData {
  // Distinct assignees (excluding the "Unassigned" sentinel) become filter options.
  const assignees = new Map<string, string>()
  for (const t of tasks) if (t.owner && t.owner !== 'Unassigned') assignees.set(t.owner, t.owner)
  return {
    tasks: tasks.map((t) => taskDocToListItem(t, t.session_id ? sessionTitles.get(t.session_id) : undefined)),
    projectOptions: [],
    assigneeOptions: [...assignees.values()].sort().map((name) => ({ id: name, name })),
  }
}

const DAY_MS = 86_400_000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Buckets a session by its real timestamp — Today / Yesterday / This week / Earlier (future → Upcoming). */
export function dateGroupFor(iso: string): SessionDateGroup {
  const diffDays = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / DAY_MS)
  if (diffDays > 0) return 'upcoming'
  if (diffDays === 0) return 'today'
  if (diffDays === -1) return 'yesterday'
  if (diffDays >= -7) return 'this-week'
  return 'earlier'
}

/**
 * Combined pipeline status for a session row. Transcription runs first (pending/processing →
 * "processing", failed → "failed"), then Claude analysis. A transcript-complete session with no
 * review yet is still "processing" (analysis auto-fires); a completed review is "ready".
 */
export function liveSessionStatus(session: LiveSessionDoc): SessionStatusValue {
  const t = session.transcription_status
  if (t === 'pending' || t === 'processing') return 'processing'
  if (t === 'failed') return 'failed'
  if (session.review_status === 'failed') return 'failed'
  if (session.review_status === 'completed') return 'ready'
  return 'processing' // transcript ready, analysis pending/in-flight
}

function sessionListItem(session: LiveSessionDoc): SessionListItem {
  const iso = tsToIso(session.created_at)
  const durationMinutes = session.audio?.durationSeconds ? Math.max(1, Math.round(session.audio.durationSeconds / 60)) : 0
  const status = liveSessionStatus(session)
  const summary = session.review_summary?.trim() || session.notes?.trim() || ''
  return {
    id: session.id,
    title: session.title?.trim() || 'Untitled session',
    // Prefer the AI executive summary (denormalized onto the session); fall back to notes, then a
    // state-appropriate hint — never a raw id or the literal "recall".
    summaryPreview: summary || (status === 'processing' ? 'Analyzing this conversation…' : status === 'failed' ? 'Processing failed — open to retry' : 'Open the AI session review'),
    projectId: session.project_id ?? undefined,
    projectName: session.project_name ?? undefined,
    participantNames: session.participants ?? [],
    dateLabel: formatDateLabel(iso),
    timeLabel: formatTimeLabel(iso),
    durationLabel: durationMinutes ? `${durationMinutes} min` : '',
    durationMinutes,
    status,
    decisionsCount: session.decisions_count ?? 0,
    tasksCount: session.tasks_count ?? 0,
    needsAttention: status === 'failed',
    rawDate: iso,
    dateGroup: dateGroupFor(iso),
  }
}

export function toSessionsListData(sessions: LiveSessionDoc[]): SessionsListData {
  return { sessions: sessions.map(sessionListItem), projectOptions: [] }
}

// Re-export so tests and callers have one import site.
export { formatDueLabel }
