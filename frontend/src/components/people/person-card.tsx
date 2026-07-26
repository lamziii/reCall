import { useNavigate } from 'react-router-dom'
import { CheckSquare, FolderKanban, Mic } from 'lucide-react'
import { Card } from '@/components/data-display/card'
import { Avatar } from '@/components/data-display/avatar'
import { StatusDot, type StatusDotState } from '@/components/data-display/status-dot'
import { Caption, Small, Title } from '@/components/typography'
import type { PersonListItem } from '@/data/people/types'

const STATUS_DOT: Record<PersonListItem['status'], StatusDotState> = { active: 'success', away: 'warning', offline: 'offline' }

export function PersonCard({ person }: { person: PersonListItem }) {
  const navigate = useNavigate()

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/app/people/${person.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/app/people/${person.id}`)
      }}
      className="flex cursor-pointer flex-col gap-4 p-5 transition-base hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          <Avatar name={person.name} size="lg" />
          <StatusDot state={STATUS_DOT[person.status]} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-surface-raised" />
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <Title className="truncate">{person.name}</Title>
        <Small className="truncate text-muted-foreground">{person.role}</Small>
        <Caption className="truncate text-subtle-foreground">
          {person.department}
          {person.teamName ? ` · ${person.teamName}` : ''}
        </Caption>
      </div>

      <Caption className="truncate text-subtle-foreground">{person.email}</Caption>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-subtle pt-3 text-caption text-subtle-foreground">
        <span className="inline-flex items-center gap-1">
          <Mic className="size-3" />
          {person.sessionsAttended} sessions
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckSquare className="size-3" />
          {person.tasksAssigned} tasks
        </span>
        <span className="inline-flex items-center gap-1">
          <FolderKanban className="size-3" />
          {person.projectsCount} projects
        </span>
      </div>
    </Card>
  )
}
