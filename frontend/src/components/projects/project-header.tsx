import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Plus } from 'lucide-react'
import { BackButton } from '@/components/navigation/back-button'
import { Button, IconButton } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Body, H2 } from '@/components/typography'
import { useToast } from '@/components/feedback/toast'
import { ProjectStatus } from './project-status'
import type { ProjectDetailData } from '@/data/projects/types'

export function ProjectHeader({ project }: { project: ProjectDetailData }) {
  const navigate = useNavigate()
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-5 pb-6">
      <BackButton label="Projects" onClick={() => navigate('/app/projects')} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <H2>{project.name}</H2>
            <ProjectStatus status={project.status} />
          </div>
          <Body className="max-w-[60ch] text-muted-foreground">{project.description}</Body>
          <Body className="text-caption text-subtle-foreground">
            {project.ownerName} · Created {project.createdAtLabel} · Target {project.targetDateLabel}
          </Body>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Plus />} onClick={() => navigate('/app/sessions')}>
            Add session
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <IconButton icon={<MoreHorizontal />} label="More actions" variant="secondary" size="sm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => toast({ title: 'Project archived', description: 'This is mocked for the demo.' })}>
                Archive project
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast({ title: 'Link copied' })}>Copy link</DropdownMenuItem>
              <DropdownMenuItem danger onSelect={() => toast({ title: 'Delete is disabled in this demo', variant: 'warning' })}>
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
