import { FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function ProjectsPage() {
  return (
    <EmptyRoutePage
      title="Projects"
      description="Organize work by initiative."
      emptyIcon={<FolderKanban />}
      emptyTitle="No projects yet"
      emptyDescription="Create a project to start grouping related sessions and tasks."
      action={<Button>New project</Button>}
    />
  )
}
