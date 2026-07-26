import { getWorkspaceData } from '../workspace-repository'
import type { Person, Project, Team, WorkspaceData } from '../types'
import { formatDueLabel } from '../home/format'
import { getSessionsListData } from '../sessions/sessions-service'
import type { SessionTaskItem } from '../sessions/types'
import type { PeopleListData, PersonDetailData, PersonListItem, PersonProjectSummary } from './types'

function teamName(teams: Team[], id?: string): string | undefined {
  return id ? teams.find((t) => t.id === id)?.name : undefined
}

function personProjects(person: Person, projects: Project[], data: WorkspaceData): PersonProjectSummary[] {
  return projects
    .filter((project) => {
      if (project.ownerId === person.id) return true
      return data.sessions.some((s) => s.projectId === project.id && s.participantIds.includes(person.id))
    })
    .map((project) => ({ id: project.id, name: project.name, status: project.status, isOwner: project.ownerId === person.id }))
}

export function getPeopleListData(): PeopleListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const { people, teams, sessions, tasks, projects } = data

  const items: PersonListItem[] = people.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    department: person.department,
    email: person.email,
    status: person.status,
    teamName: teamName(teams, person.teamId),
    sessionsAttended: sessions.filter((s) => s.participantIds.includes(person.id)).length,
    tasksAssigned: tasks.filter((t) => t.assigneeId === person.id).length,
    projectsCount: personProjects(person, projects, data).length,
  }))

  const departmentOptions = [...new Set(people.map((p) => p.department))].sort()

  return { people: items, departmentOptions }
}

export function getPersonDetailData(personId: string): PersonDetailData | null | 'not-found' {
  const data = getWorkspaceData()
  if (!data) return null
  const person = data.people.find((p) => p.id === personId)
  if (!person) return 'not-found'

  const { teams, tasks, projects } = data
  const sessionListData = getSessionsListData()
  const sessions = (sessionListData?.sessions ?? []).filter((s) => data.sessions.find((raw) => raw.id === s.id)?.participantIds.includes(personId))

  const personTasks = tasks.filter((t) => t.assigneeId === personId)
  const taskItems: SessionTaskItem[] = personTasks.map((t) => ({
    id: t.id,
    title: t.title,
    assigneeName: person.name,
    priority: t.priority,
    status: t.status,
    dueDateLabel: formatDueLabel(t.dueDate),
  }))

  return {
    id: person.id,
    name: person.name,
    role: person.role,
    department: person.department,
    email: person.email,
    status: person.status,
    teamName: teamName(teams, person.teamId),
    teamId: person.teamId,
    projects: personProjects(person, projects, data),
    sessions,
    tasks: taskItems,
  }
}
