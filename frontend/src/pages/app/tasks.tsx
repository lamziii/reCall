import { CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function TasksPage() {
  return (
    <EmptyRoutePage
      title="Tasks"
      description="Action items captured from your sessions."
      emptyIcon={<CheckSquare />}
      emptyTitle="No tasks yet"
      emptyDescription="Tasks generated from your sessions will show up here."
      action={<Button>New task</Button>}
    />
  )
}
