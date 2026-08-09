import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, FolderKanban, Users } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { Tab, TabList, TabPanel, Tabs } from '@/components/navigation/tabs'
import { Skeleton } from '@/components/feedback/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/navigation/back-button'
import { Avatar } from '@/components/data-display/avatar'
import { List, ListItem } from '@/components/data-display/list'
import { ProjectStatus } from '@/components/projects/project-status'
import { SessionRow } from '@/components/sessions/session-row'
import { DecisionList } from '@/components/sessions/decision-list'
import { Body, Caption, H2, Small } from '@/components/typography'
import { useToast } from '@/components/feedback/toast'
import { useTeamDetailData } from '@/data/teams/use-team-detail-data'

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, refetch } = useTeamDetailData(teamId)
  const [tab, setTab] = useState('overview')

  function decisionActionToast() {
    toast({ title: 'Open the linked session to approve or reject this decision.' })
  }

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-96 max-w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <ErrorState title="We couldn't load this team" onRetry={refetch} onBack={() => navigate('/app/teams')} />
      </PageContainer>
    )
  }

  if (state.status === 'not-found') {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertTriangle />}
          title="Team not found"
          description="This team may have been removed, or the link is incorrect."
          action={
            <Button variant="secondary" onClick={() => navigate('/app/teams')}>
              Back to Teams
            </Button>
          }
          className="flex-1 py-24"
        />
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer>
      <div className="flex flex-col gap-5 pb-6">
        <BackButton label="Teams" onClick={() => navigate('/app/teams')} />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-subtle-foreground">
              <Users className="size-4" />
            </span>
            <H2 className="min-w-0 break-words">{data.name}</H2>
          </div>
          <Body className="max-w-[60ch] text-muted-foreground">{data.description}</Body>
          <Caption className="text-subtle-foreground">
            {data.members.length} members · {data.projects.length} projects · {data.sessions.length} sessions
          </Caption>
        </div>
      </div>

      <Tabs value={tab} defaultValue="overview" onValueChange={setTab}>
        <TabList className="overflow-x-auto">
          <Tab value="overview">Overview</Tab>
          <Tab value="members">Members</Tab>
          <Tab value="projects">Projects</Tab>
          <Tab value="sessions">Sessions</Tab>
          <Tab value="decisions">Recent decisions</Tab>
        </TabList>

        <TabPanel value="overview" className="flex flex-col gap-8 py-6">
          <section className="flex flex-col gap-3">
            <Small className="font-medium text-foreground">Members</Small>
            <List>
              {data.members.map((member) => (
                <ListItem
                  key={member.id}
                  interactive
                  onClick={() => navigate(`/app/people/${member.id}`)}
                  leading={<Avatar name={member.name} size="sm" />}
                  trailing={<Caption className="text-subtle-foreground">{member.role}</Caption>}
                >
                  {member.name}
                </ListItem>
              ))}
            </List>
          </section>

          <section className="flex flex-col gap-3">
            <Small className="font-medium text-foreground">Projects</Small>
            {data.projects.length === 0 ? (
              <EmptyState icon={<FolderKanban />} title="No projects yet" className="py-6" />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                    className="focus-ring flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-fast hover:bg-surface-hover"
                  >
                    <span className="min-w-0 flex-1 truncate text-small font-medium text-foreground">{project.name}</span>
                    <ProjectStatus status={project.status} />
                  </button>
                ))}
              </div>
            )}
          </section>
        </TabPanel>

        <TabPanel value="members" className="py-6">
          <List>
            {data.members.map((member) => (
              <ListItem
                key={member.id}
                interactive
                onClick={() => navigate(`/app/people/${member.id}`)}
                leading={<Avatar name={member.name} size="sm" />}
                trailing={<Caption className="text-subtle-foreground">{member.role}</Caption>}
              >
                {member.name}
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <TabPanel value="projects" className="py-6">
          {data.projects.length === 0 ? (
            <EmptyState icon={<FolderKanban />} title="No projects yet" className="py-8" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/app/projects/${project.id}`)}
                  className="focus-ring flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-fast hover:bg-surface-hover"
                >
                  <span className="min-w-0 flex-1 truncate text-small font-medium text-foreground">{project.name}</span>
                  <ProjectStatus status={project.status} />
                </button>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value="sessions" className="py-6">
          {data.sessions.length === 0 ? (
            <EmptyState title="No sessions yet" className="py-8" />
          ) : (
            <List>
              {data.sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value="decisions" className="py-6">
          <DecisionList decisions={data.recentDecisions} onApprove={decisionActionToast} onReject={decisionActionToast} />
        </TabPanel>
      </Tabs>
    </PageContainer>
  )
}
