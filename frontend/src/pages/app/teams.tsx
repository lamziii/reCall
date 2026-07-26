import { Users } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { useToast } from '@/components/feedback/toast'
import { useTeamsListData } from '@/data/teams/use-teams-list-data'
import { TeamCard } from '@/components/teams/team-card'

export function TeamsPage() {
  const { toast } = useToast()
  const { state, refetch } = useTeamsListData()

  const actions = (
    <Button
      onClick={() => toast({ title: 'New team', description: "This is a placeholder for the hackathon demo — it's not wired up to a backend yet." })}
    >
      New team
    </Button>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Teams" description="Group people by function or department." actions={actions} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="Teams" description="Group people by function or department." actions={actions} />
        <ErrorState title="We couldn't load your teams" onRetry={refetch} />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="Teams" description="Group people by function or department." actions={actions} />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<Users />}
            title="No teams yet"
            description="Create a team to organize people and projects together."
            action={actions}
          />
        </div>
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer>
      <PageHeader title="Teams" description="Group people by function or department." actions={actions} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </PageContainer>
  )
}
