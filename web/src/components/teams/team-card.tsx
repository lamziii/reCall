import { useNavigate } from '@/lib/router-compat'
import { FolderKanban, Mic, Users } from 'lucide-react'
import { Card } from '@/components/data-display/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { Caption, Small, Title } from '@/components/typography'
import type { TeamListItem } from '@/data/teams/types'

export function TeamCard({ team }: { team: TeamListItem }) {
  const navigate = useNavigate()

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground">
          <Users className="size-4" />
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Title className="truncate">{team.name}</Title>
        <Small className="line-clamp-2 text-muted-foreground">{team.description}</Small>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-subtle-foreground">
        <span className="inline-flex items-center gap-1">
          <FolderKanban className="size-3" />
          {team.projectsCount} projects
        </span>
        <span className="inline-flex items-center gap-1">
          <Mic className="size-3" />
          {team.sessionsCount} sessions
        </span>
      </div>

      {team.lastActivityLabel && <Caption className="text-subtle-foreground">Last activity {team.lastActivityLabel}</Caption>}

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        {team.memberNames.length > 0 ? (
          <AvatarGroup max={5} spacing="compact">
            {team.memberNames.map((name) => (
              <Avatar key={name} name={name} size="xs" />
            ))}
          </AvatarGroup>
        ) : (
          <span />
        )}
        <Button variant="secondary" size="sm" onClick={() => navigate(`/app/teams/${team.id}`)}>
          Open
        </Button>
      </div>
    </Card>
  )
}
