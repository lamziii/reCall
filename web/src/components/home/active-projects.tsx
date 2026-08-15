import { useNavigate } from '@/lib/router-compat'
import { FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { List, ListItem } from '@/components/data-display/list'
import { Progress } from '@/components/feedback/progress'
import { EmptyState } from '@/components/feedback/empty-state'
import { Caption, Small, Title } from '@/components/typography'
import type { ProjectStatus } from '@/data/types'
import type { ProjectSummary } from '@/data/home/types'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  'at-risk': 'At risk',
  'on-hold': 'On hold',
  done: 'Done',
  archived: 'Archived',
}

const STATUS_COLOR: Record<ProjectStatus, string> = {
  planning: 'text-subtle-foreground',
  active: 'text-accent',
  'at-risk': 'text-danger',
  'on-hold': 'text-warning',
  done: 'text-success',
  archived: 'text-subtle-foreground',
}

export function ActiveProjects({ projects }: { projects: ProjectSummary[] }) {
  const navigate = useNavigate()

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Title>Active projects</Title>
        <Button variant="text" size="sm" onClick={() => navigate('/app/projects')} className="shrink-0">
          View all
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban />} title="No active projects" description="Projects will show up here." className="py-8" />
      ) : (
        <List>
          {projects.map((project) => (
            <ListItem
              key={project.id}
              interactive
              role="link"
              tabIndex={0}
              onClick={() => navigate(project.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(project.href)
              }}
              className="flex-col items-stretch gap-2 py-3"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-small font-medium text-foreground">{project.name}</span>
                <Caption className={cn('shrink-0', STATUS_COLOR[project.status])}>{STATUS_LABEL[project.status]}</Caption>
              </span>
              <Progress value={project.progressPct} label={`${project.name} progress`} />
              <span className="flex items-center justify-between gap-3">
                <Caption className="shrink-0 text-subtle-foreground">{project.ownerName}</Caption>
                <Caption className="truncate text-subtle-foreground">{project.nextMilestoneLabel}</Caption>
              </span>
              {project.latestSessionTitle && (
                <Small className="truncate text-muted-foreground">Latest: {project.latestSessionTitle}</Small>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </div>
  )
}
