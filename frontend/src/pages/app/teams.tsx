import { UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyRoutePage } from './empty-route-page'

export function TeamsPage() {
  return (
    <EmptyRoutePage
      title="Teams"
      description="Group people by function or department."
      emptyIcon={<UsersRound />}
      emptyTitle="No teams yet"
      emptyDescription="Create a team to organize people and projects together."
      action={<Button>New team</Button>}
    />
  )
}
