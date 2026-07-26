import { getWorkspaceData } from '../workspace-repository'
import type { Person, Project, Team, WorkspaceData } from '../types'
import { formatFullDateTime } from '../home/format'
import { getSessionsListData } from '../sessions/sessions-service'
import type { SessionDecisionItem } from '../sessions/types'
import type { TeamDetailData, TeamListItem, TeamsListData } from './types'

function memberProjects(team: Team, projects: Project[], data: WorkspaceData): Project[] {
  return projects.filter(
    (project) => team.memberIds.includes(project.ownerId) || data.sessions.some((s) => s.projectId === project.id && s.participantIds.some((id) => team.memberIds.includes(id))),
  )
}

export function getTeamsListData(): TeamsListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const { teams, people, projects, sessions } = data

  const items: TeamListItem[] = teams.map((team) => {
    const teamSessions = sessions.filter((s) => s.participantIds.some((id) => team.memberIds.includes(id)))
    const latest = [...teamSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.memberIds.length,
      memberNames: team.memberIds.map((id) => people.find((p) => p.id === id)?.name).filter((n): n is string => Boolean(n)),
      projectsCount: memberProjects(team, projects, data).length,
      sessionsCount: teamSessions.length,
      lastActivityLabel: latest ? formatFullDateTime(latest.date) : undefined,
    }
  })

  return { teams: items }
}

export function getTeamDetailData(teamId: string): TeamDetailData | null | 'not-found' {
  const data = getWorkspaceData()
  if (!data) return null
  const team = data.teams.find((t) => t.id === teamId)
  if (!team) return 'not-found'

  const { people, projects, decisions } = data
  const members: Person[] = team.memberIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p))
  const teamProjects = memberProjects(team, projects, data)

  const sessionListData = getSessionsListData()
  const teamSessions = (sessionListData?.sessions ?? []).filter((s) =>
    data.sessions.find((raw) => raw.id === s.id)?.participantIds.some((id) => team.memberIds.includes(id)),
  )

  const recentDecisions: SessionDecisionItem[] = decisions
    .filter((d) => team.memberIds.includes(d.ownerId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      ownerName: people.find((p) => p.id === d.ownerId)?.name,
      confidence: d.confidence,
      timestampLabel: formatFullDateTime(d.createdAt),
      projectName: projects.find((p) => p.id === d.projectId)?.name,
      linkedTaskCount: d.linkedTaskIds.length,
    }))

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    members: members.map((m) => ({ id: m.id, name: m.name, role: m.role })),
    projects: teamProjects.map((p) => ({ id: p.id, name: p.name, status: p.status })),
    sessions: teamSessions,
    recentDecisions,
  }
}
