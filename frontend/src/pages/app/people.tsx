import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function PeoplePage() {
  return (
    <EmptyRoutePage
      title="People"
      description="Everyone in your workspace."
      emptyIcon={<Users />}
      emptyTitle="No people yet"
      emptyDescription="Invite teammates to start collaborating in Recall."
      action={<Button>Invite people</Button>}
    />
  )
}
