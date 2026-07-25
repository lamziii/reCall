import { useNavigate } from 'react-router-dom'
import { CalendarClock, CheckSquare, FileText, FolderKanban, GitBranch, Layers, Rocket, Target } from 'lucide-react'
import { Card } from '@/components/data-display/card'
import { Progress } from '@/components/feedback/progress'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { Caption, Small, Title } from '@/components/typography'
import { ProjectStatus } from './project-status'
import type { ProjectListItem } from '@/data/projects/types'

const ICONS = [FolderKanban, Rocket, Target, Layers, GitBranch]

function iconFor(id: string) {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0)
  return ICONS[sum % ICONS.length]
}

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const navigate = useNavigate()
  const Icon = iconFor(project.id)

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/app/projects/${project.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/app/projects/${project.id}`)
      }}
      className="flex cursor-pointer flex-col gap-4 p-5 transition-base hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground">
          <Icon className="size-4" />
        </span>
        <ProjectStatus status={project.status} />
      </div>

      <div className="flex flex-col gap-1">
        <Title className="truncate">{project.name}</Title>
        <Small className="line-clamp-2 text-muted-foreground">{project.description}</Small>
      </div>

      <div className="flex flex-col gap-1.5">
        <Progress value={project.progressPct} label={`${project.name} progress`} />
        <Caption className="text-subtle-foreground">{project.progressPct}% complete · Updated {project.updatedLabel}</Caption>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-subtle-foreground">
        <span className="inline-flex items-center gap-1">
          <FileText className="size-3" />
          {project.sessionsCount} sessions
        </span>
        <span className="inline-flex items-center gap-1">
          <GitBranch className="size-3" />
          {project.decisionsCount} decisions
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckSquare className="size-3" />
          {project.tasksCount} tasks
        </span>
        <span className="inline-flex items-center gap-1">
          <FileText className="size-3" />
          {project.documentsCount} docs
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        {project.teamNames.length > 0 ? (
          <AvatarGroup max={4} spacing="compact">
            {project.teamNames.map((name) => (
              <Avatar key={name} name={name} size="xs" />
            ))}
          </AvatarGroup>
        ) : (
          <span />
        )}
        {project.nextMeetingLabel && (
          <Caption className="inline-flex items-center gap-1 truncate text-subtle-foreground">
            <CalendarClock className="size-3 shrink-0" />
            {project.nextMeetingLabel}
          </Caption>
        )}
      </div>
    </Card>
  )
}
