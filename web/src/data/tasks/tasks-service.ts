import { getWorkspaceData, saveWorkspaceData } from '../workspace-repository'
import type { Person, Project, SessionRecord, Task } from '../types'
import { formatDueLabel, formatDateLabel, formatFullDateTime } from '../home/format'
import { generateTranscript } from '../sessions/transcript'
import type { TaskDetailData, TaskListItem, TasksListData } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'

function personName(people: Person[], id?: string): string | undefined {
  return id ? people.find((p) => p.id === id)?.name : undefined
}

function projectName(projects: Project[], id?: string): string | undefined {
  return id ? projects.find((p) => p.id === id)?.name : undefined
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'canceled') return false
  return new Date(task.dueDate).getTime() < Date.now()
}

function toListItem(task: Task, people: Person[], projects: Project[], sessions: SessionRecord[]): TaskListItem {
  const session = task.sourceSessionId ? sessions.find((s) => s.id === task.sourceSessionId) : undefined
  return {
    id: task.id,
    title: task.title,
    projectId: task.projectId,
    projectName: projectName(projects, task.projectId),
    assigneeId: task.assigneeId,
    assigneeName: personName(people, task.assigneeId),
    priority: task.priority,
    status: task.status,
    dueDateRaw: task.dueDate,
    sourceSessionId: task.sourceSessionId,
    sessionTitle: session?.title,
    isOverdue: isOverdue(task),
  }
}

export function getTasksListData(): TasksListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const { tasks, people, projects, sessions } = data

  return {
    tasks: tasks.map((t) => toListItem(t, people, projects, sessions)),
    projectOptions: projects.map((p) => ({ id: p.id, name: p.name })),
    assigneeOptions: people.map((p) => ({ id: p.id, name: p.name })),
  }
}

function buildDescription(task: Task, projectLabel?: string, sessionTitle?: string): string {
  if (task.blocker) return task.blocker
  if (sessionTitle) return `Captured from "${sessionTitle}"${projectLabel ? ` in ${projectLabel}` : ''}.`
  if (projectLabel) return `A task tracked under ${projectLabel}.`
  return 'A task captured for your workspace.'
}

function buildActivity(task: Task, assigneeName?: string): TaskDetailData['activity'] {
  const entries: TaskDetailData['activity'] = []
  const createdAt = task.dueDate ?? task.completedAt ?? new Date().toISOString()

  entries.push({
    id: `${task.id}-created`,
    label: assigneeName ? `Task created and assigned to ${assigneeName}` : 'Task created',
    timestampLabel: formatFullDateTime(createdAt),
  })

  if (task.status === 'blocked' && task.blocker) {
    entries.push({ id: `${task.id}-blocked`, label: `Marked blocked — ${task.blocker}`, timestampLabel: formatFullDateTime(createdAt) })
  }

  if (task.status === 'done' && task.completedAt) {
    entries.push({
      id: `${task.id}-done`,
      label: assigneeName ? `${assigneeName} marked this task done` : 'Marked done',
      timestampLabel: formatFullDateTime(task.completedAt),
    })
  }

  return entries
}

export function getTaskDetailData(taskId: string): TaskDetailData | null | 'not-found' {
  const data = getWorkspaceData()
  if (!data) return null
  const task = data.tasks.find((t) => t.id === taskId)
  if (!task) return 'not-found'

  const { people, projects, sessions } = data
  const assigneeName = personName(people, task.assigneeId)
  const projectLabel = projectName(projects, task.projectId)
  const session = task.sourceSessionId ? sessions.find((s) => s.id === task.sourceSessionId) : undefined

  let conversationExcerpt: TaskDetailData['conversationExcerpt']
  if (session) {
    const participantNames = session.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n))
    const sessionDecisions = data.decisions.filter((d) => d.sourceSessionId === session.id)
    const sessionTasks = data.tasks.filter((t) => t.sourceSessionId === session.id)
    const sessionQuestions = data.questions.filter((q) => q.sourceSessionId === session.id)
    const transcript = generateTranscript(session, people, participantNames, sessionDecisions, sessionTasks, sessionQuestions)
    const relevant = transcript.find((entry) => entry.text.toLowerCase().includes(task.title.toLowerCase().split(' ')[0])) ?? transcript[0]
    if (relevant) conversationExcerpt = { speakerName: relevant.speakerName, text: relevant.text }
  }

  return {
    id: task.id,
    title: task.title,
    description: buildDescription(task, projectLabel, session?.title),
    status: task.status,
    priority: task.priority,
    assigneeName,
    assigneeId: task.assigneeId,
    dueDateLabel: formatDueLabel(task.dueDate),
    dueDateRaw: task.dueDate,
    isOverdue: isOverdue(task),
    blocker: task.blocker,
    projectId: task.projectId,
    projectName: projectLabel,
    sourceSessionId: task.sourceSessionId,
    sessionTitle: session?.title,
    sessionDateLabel: session ? formatDateLabel(session.date) : undefined,
    conversationExcerpt,
    activity: buildActivity(task, assigneeName),
  }
}

/** Global task status mutator — not scoped to a parent session/project, since the Tasks page spans all of them. */
export function setTaskStatus(taskId: string, status: TaskStatusValue): TaskDetailData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated = {
    ...data,
    tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : t.completedAt } : t)),
  }
  saveWorkspaceData(updated)
  const result = getTaskDetailData(taskId)
  return result === 'not-found' ? null : result
}
