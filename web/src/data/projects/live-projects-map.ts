/**
 * Maps the live Firestore project/session/task docs into the Project view-models the existing
 * (demo-built) Projects UI already renders — so live mode reuses the same cards/detail without a
 * visual rewrite. The live status set (active/completed/archived) is mapped onto the richer demo
 * ProjectStatus the UI's status badge understands. Counts and progress are DERIVED from related
 * entities queried by project_id (never stored on the project).
 */
import type { LiveProjectDoc, LiveSessionDoc, LiveTaskDoc } from '@/data/live/types'
import { sessionListItem, tsToIso, statusDbToView, priorityDbToView } from '@/data/live/mappers'
import { formatDateLabel, formatFullDateTime, formatDueLabel } from '@/data/home/format'
import type { ProjectStatus as DemoProjectStatus } from '@/data/types'
import type { SessionTaskItem } from '@/data/sessions/types'
import type { ProjectDetailData, ProjectListItem, ProjectMember, ProjectTimelineItem } from './types'

/** Live 3-state status → the demo status the ProjectStatus badge renders. */
export function mapLiveStatus(status: LiveProjectDoc['status']): DemoProjectStatus {
  return status === 'completed' ? 'done' : status === 'archived' ? 'archived' : 'active'
}

function projectSessions(sessions: LiveSessionDoc[], projectId: string): LiveSessionDoc[] {
  return sessions.filter((s) => s.project_id === projectId)
}
function projectTasks(tasks: LiveTaskDoc[], projectId: string): LiveTaskDoc[] {
  return tasks.filter((t) => t.project_id === projectId)
}

function progressFromTasks(tasks: LiveTaskDoc[]): number {
  if (!tasks.length) return 0
  return Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)
}

function updatedIso(p: LiveProjectDoc): string {
  return tsToIso(p.updated_at) || tsToIso(p.created_at) || new Date().toISOString()
}

export function liveProjectToListItem(
  p: LiveProjectDoc,
  sessions: LiveSessionDoc[],
  tasks: LiveTaskDoc[],
  userId: string | undefined,
): ProjectListItem {
  const ps = projectSessions(sessions, p.id)
  const pt = projectTasks(tasks, p.id)
  const updated = updatedIso(p)
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    status: mapLiveStatus(p.status),
    ownerId: p.owner_id,
    ownerName: p.owner_id === userId ? 'You' : 'Member',
    teamNames: [],
    progressPct: progressFromTasks(pt),
    targetDateLabel: '—',
    targetDateRaw: updated,
    updatedLabel: formatDateLabel(updated),
    updatedRaw: updated,
    sessionsCount: ps.length,
    decisionsCount: ps.reduce((n, s) => n + (s.decisions_count ?? 0), 0),
    tasksCount: pt.length,
    documentsCount: 0,
  }
}

export function liveProjectToDetail(
  p: LiveProjectDoc,
  sessions: LiveSessionDoc[],
  tasks: LiveTaskDoc[],
  userId: string | undefined,
): ProjectDetailData {
  const ps = projectSessions(sessions, p.id)
  const pt = projectTasks(tasks, p.id)

  const sessionItems = ps.map(sessionListItem).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())

  const taskItems: SessionTaskItem[] = pt.map((t) => ({
    id: t.id,
    title: t.title,
    assigneeName: t.owner && t.owner !== 'Unassigned' ? t.owner : undefined,
    priority: priorityDbToView(t.priority),
    status: statusDbToView(t.status),
    dueDateLabel: formatDueLabel(t.deadline ?? undefined),
  }))

  const timeline: ProjectTimelineItem[] = sessionItems.map((s) => ({
    id: `${s.id}-recorded`,
    label: 'Session recorded',
    detail: s.title,
    timestampLabel: formatFullDateTime(s.rawDate),
    timestampRaw: s.rawDate,
    kind: 'session',
  }))

  const owner: ProjectMember = { name: p.owner_id === userId ? 'You' : 'Owner', role: 'Owner', isOwner: true }

  const openTasks = pt.filter((t) => t.status !== 'done').length
  const aiSummary =
    ps.length === 0
      ? `${p.name} has no recorded sessions yet. Start a session and link it to this project to build its context.`
      : `${p.name} has ${ps.length} recorded session${ps.length === 1 ? '' : 's'}${pt.length ? `, with ${openTasks} of ${pt.length} task${pt.length === 1 ? '' : 's'} still open` : ''}.`

  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    status: mapLiveStatus(p.status),
    ownerName: owner.name,
    createdAtLabel: formatDateLabel(tsToIso(p.created_at) || updatedIso(p)),
    targetDateLabel: '—',
    progressPct: progressFromTasks(pt),
    aiSummary,
    members: [owner],
    sessions: sessionItems,
    decisions: [],
    tasks: taskItems,
    questions: [],
    timeline,
    documentsCount: 0,
  }
}
