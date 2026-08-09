import { useNavigate } from 'react-router-dom'
import { CheckSquare, GitBranch } from 'lucide-react'
import { ListItem } from '@/components/data-display/list'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { Progress } from '@/components/feedback/progress'
import { Caption } from '@/components/typography'
import { ProjectStatus } from './project-status'
import type { ProjectListItem } from '@/data/projects/types'

export function ProjectRow({ project }: { project: ProjectListItem }) {
  const navigate = useNavigate()

  function open() {
    navigate(`/app/projects/${project.id}`)
  }

  return (
    <ListItem
      interactive
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open()
      }}
      className="items-start gap-4 py-3.5"
      trailing={
        <div className="flex flex-col items-end gap-1.5 text-right">
          <ProjectStatus status={project.status} />
          <Caption className="text-subtle-foreground">Updated {project.updatedLabel}</Caption>
        </div>
      }
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-small font-medium text-foreground">{project.name}</span>
          {project.teamNames.length > 0 && (
            <AvatarGroup max={3} spacing="compact">
              {project.teamNames.map((name) => (
                <Avatar key={name} name={name} size="xs" />
              ))}
            </AvatarGroup>
          )}
        </div>
        <Caption className="line-clamp-1 text-muted-foreground">{project.description}</Caption>
        <div className="flex items-center gap-3">
          <Progress value={project.progressPct} label={`${project.name} progress`} className="w-32" />
          <Caption className="text-subtle-foreground">{project.progressPct}%</Caption>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-subtle-foreground">
          <span className="max-w-[12rem] truncate">{project.ownerName}</span>
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3" />
            {project.decisionsCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="size-3" />
            {project.tasksCount}
          </span>
        </div>
      </div>
    </ListItem>
  )
}
