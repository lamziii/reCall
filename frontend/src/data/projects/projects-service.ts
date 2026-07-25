import { getWorkspaceData, saveWorkspaceData } from '../workspace-repository'
import type { Decision, Person, Project, Risk, SessionRecord, Task, WorkspaceData } from '../types'
import { formatDateLabel, formatDueLabel, formatFullDateTime } from '../home/format'
import { getSessionsListData } from '../sessions/sessions-service'
import type { SessionDecisionItem, SessionQuestionItem, SessionTaskItem } from '../sessions/types'
import type { ProjectDetailData, ProjectListItem, ProjectMember, ProjectTimelineItem, ProjectsListData } from './types'
import type { DecisionStatusValue } from '@/components/recall/decision-status'
import type { TaskStatusValue } from '@/components/recall/task-status'

function personName(people: Person[], id?: string): string | undefined {
  return id ? people.find((p) => p.id === id)?.name : undefined
}

function latestTimestamp(dates: string[]): string {
  return dates.reduce((latest, d) => (new Date(d).getTime() > new Date(latest).getTime() ? d : latest))
}

export function getProjectsListData(): ProjectsListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const { projects, people, sessions, decisions, tasks } = data

  const items: ProjectListItem[] = projects.map((p) => {
    const projectSessions = sessions.filter((s) => s.projectId === p.id)
    const projectDecisions = decisions.filter((d) => d.projectId === p.id)
    const projectTasks = tasks.filter((t) => t.projectId === p.id)
    const teamIds = new Set([p.ownerId, ...projectSessions.flatMap((s) => s.participantIds)])
    const nextMeeting = projectSessions
      .filter((s) => s.status === 'scheduled' && new Date(s.date).getTime() > Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    const updatedRaw = latestTimestamp([p.createdAt, ...projectSessions.map((s) => s.date), ...projectDecisions.map((d) => d.createdAt)])

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      ownerId: p.ownerId,
      ownerName: personName(people, p.ownerId) ?? 'Unassigned',
      teamNames: [...teamIds].map((id) => personName(people, id)).filter((n): n is string => Boolean(n)),
      progressPct: p.progressPct,
      targetDateLabel: formatDateLabel(p.targetDate),
      updatedLabel: formatDateLabel(updatedRaw),
      updatedRaw,
      sessionsCount: projectSessions.length,
      decisionsCount: projectDecisions.length,
      tasksCount: projectTasks.length,
      documentsCount: 0,
      nextMeetingLabel: nextMeeting ? formatFullDateTime(nextMeeting.date) : undefined,
    }
  })

  return { projects: items, ownerOptions: people.map((p) => ({ id: p.id, name: p.name })) }
}

function buildTimeline(sessions: SessionRecord[], decisions: Decision[], tasks: Task[]): ProjectTimelineItem[] {
  const sessionEvents: ProjectTimelineItem[] = sessions.map((s) => ({
    id: `${s.id}-recorded`,
    label: 'Session recorded',
    detail: s.title,
    timestampLabel: formatFullDateTime(s.date),
    timestampRaw: s.date,
    kind: 'session',
  }))

  const decisionEvents: ProjectTimelineItem[] = decisions.map((d) => ({
    id: `${d.id}-created`,
    label: 'Decision created',
    detail: d.title,
    timestampLabel: formatFullDateTime(d.createdAt),
    timestampRaw: d.createdAt,
    kind: 'decision',
  }))

  // ponytail: Task has no createdAt field in the sample data model — the owning session's
  // date is the closest real timestamp for "when this task was assigned".
  const sessionDateById = new Map(sessions.map((s) => [s.id, s.date]))
  const taskEvents: ProjectTimelineItem[] = tasks
    .filter((t) => t.sourceSessionId && sessionDateById.has(t.sourceSessionId))
    .map((t) => ({
      id: `${t.id}-assigned`,
      label: 'Task assigned',
      detail: t.title,
      timestampLabel: formatFullDateTime(sessionDateById.get(t.sourceSessionId!)!),
      timestampRaw: sessionDateById.get(t.sourceSessionId!)!,
      kind: 'task',
    }))

  return [...sessionEvents, ...decisionEvents, ...taskEvents].sort(
    (a, b) => new Date(b.timestampRaw).getTime() - new Date(a.timestampRaw).getTime(),
  )
}

function buildMembers(project: Project, people: Person[], sessions: SessionRecord[]): ProjectMember[] {
  const ids = new Set([project.ownerId, ...sessions.flatMap((s) => s.participantIds)])
  return [...ids]
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p))
    .map((p) => ({ name: p.name, role: p.role, isOwner: p.id === project.ownerId }))
}

function buildAiSummary(project: Project, sessions: SessionRecord[], decisions: Decision[], tasks: Task[], risks: Risk[]): string {
  const pendingDecisions = decisions.filter((d) => d.status === 'pending-review' || d.status === 'proposed').length
  const openTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'canceled').length
  const openRisks = risks.filter((r) => r.status === 'open').length
  const latestSession = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  const sentences: string[] = [
    `${project.name} is ${project.status === 'at-risk' ? 'currently at risk and' : project.status === 'on-hold' ? 'currently on hold, and' : ''} ${project.progressPct}% of the way to its ${formatDateLabel(project.targetDate)} target.`,
  ]

  if (sessions.length > 0) {
    sentences.push(
      `The team has recorded ${sessions.length} session${sessions.length === 1 ? '' : 's'}${latestSession ? `, most recently "${latestSession.title}"` : ''}.`,
    )
  } else {
    sentences.push('No sessions have been recorded for this project yet.')
  }

  if (decisions.length > 0) {
    sentences.push(
      `${decisions.length} decision${decisions.length === 1 ? ' has' : 's have'} been captured${pendingDecisions > 0 ? `, with ${pendingDecisions} still awaiting review` : ', all reviewed'}.`,
    )
  }

  if (tasks.length > 0) {
    sentences.push(`${openTasks} of ${tasks.length} task${tasks.length === 1 ? '' : 's'} ${openTasks === 1 ? 'is' : 'are'} still open.`)
  }

  if (openRisks > 0) {
    sentences.push(`${openRisks} open risk${openRisks === 1 ? '' : 's'} could affect the timeline.`)
  }

  return sentences.join(' ')
}

function buildDetail(project: Project, data: WorkspaceData): ProjectDetailData {
  const { people, sessions, decisions, tasks, questions, risks } = data
  const projectSessions = sessions.filter((s) => s.projectId === project.id)
  const projectDecisions = decisions.filter((d) => d.projectId === project.id)
  const projectTasks = tasks.filter((t) => t.projectId === project.id)
  const projectQuestions = questions.filter((q) => q.projectId === project.id)
  const projectRisks = risks.filter((r) => r.projectId === project.id)

  const sessionListData = getSessionsListData()
  const sessionItems = (sessionListData?.sessions ?? []).filter((s) => s.projectId === project.id)

  const decisionItems: SessionDecisionItem[] = projectDecisions.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    ownerName: personName(people, d.ownerId),
    confidence: d.confidence,
    timestampLabel: formatFullDateTime(d.createdAt),
    projectName: project.name,
    linkedTaskCount: d.linkedTaskIds.length,
  }))

  const taskItems: SessionTaskItem[] = projectTasks.map((t) => ({
    id: t.id,
    title: t.title,
    assigneeName: personName(people, t.assigneeId),
    priority: t.priority,
    status: t.status,
    dueDateLabel: formatDueLabel(t.dueDate),
  }))

  const questionItems: SessionQuestionItem[] = projectQuestions.map((q) => ({
    id: q.id,
    title: q.title,
    ownerName: personName(people, q.ownerId),
    projectName: project.name,
    timestampLabel: formatFullDateTime(q.createdAt),
  }))

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    ownerName: personName(people, project.ownerId) ?? 'Unassigned',
    createdAtLabel: formatDateLabel(project.createdAt),
    targetDateLabel: formatDateLabel(project.targetDate),
    progressPct: project.progressPct,
    aiSummary: buildAiSummary(project, projectSessions, projectDecisions, projectTasks, projectRisks),
    members: buildMembers(project, people, projectSessions),
    sessions: sessionItems,
    decisions: decisionItems,
    tasks: taskItems,
    questions: questionItems,
    timeline: buildTimeline(projectSessions, projectDecisions, projectTasks),
    documentsCount: 0,
  }
}

export function getProjectDetailData(projectId: string): ProjectDetailData | null | 'not-found' {
  const data = getWorkspaceData()
  if (!data) return null
  const project = data.projects.find((p) => p.id === projectId)
  if (!project) return 'not-found'
  return buildDetail(project, data)
}

export function setProjectDecisionStatus(projectId: string, decisionId: string, status: DecisionStatusValue): ProjectDetailData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated: WorkspaceData = { ...data, decisions: data.decisions.map((d) => (d.id === decisionId ? { ...d, status } : d)) }
  saveWorkspaceData(updated)
  const project = updated.projects.find((p) => p.id === projectId)
  return project ? buildDetail(project, updated) : null
}

export function setProjectTaskStatus(projectId: string, taskId: string, status: TaskStatusValue): ProjectDetailData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated: WorkspaceData = {
    ...data,
    tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : t.completedAt } : t)),
  }
  saveWorkspaceData(updated)
  const project = updated.projects.find((p) => p.id === projectId)
  return project ? buildDetail(project, updated) : null
}
