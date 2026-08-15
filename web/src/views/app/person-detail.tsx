import { useState } from 'react'
import { useNavigate, useParams } from '@/lib/router-compat'
import { AlertTriangle, FolderKanban, Mail } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { Tab, TabList, TabPanel, Tabs } from '@/components/navigation/tabs'
import { Skeleton } from '@/components/feedback/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/navigation/back-button'
import { Avatar } from '@/components/data-display/avatar'
import { StatusDot, type StatusDotState } from '@/components/data-display/status-dot'
import { ProjectStatus } from '@/components/projects/project-status'
import { List } from '@/components/data-display/list'
import { SessionRow } from '@/components/sessions/session-row'
import { SessionTaskList } from '@/components/sessions/session-task-list'
import { Body, Caption, H2, Small } from '@/components/typography'
import { useToast } from '@/components/feedback/toast'
import { usePersonDetailData } from '@/data/people/use-person-detail-data'

const STATUS_DOT: Record<string, StatusDotState> = { active: 'success', away: 'warning', offline: 'offline' }
const STATUS_LABEL: Record<string, string> = { active: 'Active', away: 'Away', offline: 'Offline' }

export function PersonDetailPage() {
  const { personId } = useParams<{ personId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, refetch } = usePersonDetailData(personId)
  const [tab, setTab] = useState('overview')

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
        <ErrorState title="We couldn't load this person" onRetry={refetch} onBack={() => navigate('/app/people')} />
      </PageContainer>
    )
  }

  if (state.status === 'not-found') {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertTriangle />}
          title="Person not found"
          description="This person may have been removed, or the link is incorrect."
          action={
            <Button variant="secondary" onClick={() => navigate('/app/people')}>
              Back to People
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
        <BackButton label="People" onClick={() => navigate('/app/people')} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <Avatar name={data.name} size="xl" />
              <StatusDot state={STATUS_DOT[data.status]} className="absolute bottom-0.5 right-0.5 ring-2 ring-bg" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <H2 className="break-words">{data.name}</H2>
              <Body className="break-words text-muted-foreground">{data.role}</Body>
              <Caption className="text-subtle-foreground">
                {data.department}
                {data.teamName ? ` · ${data.teamName}` : ''} · {STATUS_LABEL[data.status]}
              </Caption>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Mail />}
            onClick={() => {
              navigator.clipboard?.writeText(data.email)
              toast({ title: 'Email copied', description: data.email })
            }}
          >
            {data.email}
          </Button>
        </div>
      </div>

      <Tabs value={tab} defaultValue="overview" onValueChange={setTab}>
        <TabList className="overflow-x-auto">
          <Tab value="overview">Overview</Tab>
          <Tab value="projects">Projects</Tab>
          <Tab value="sessions">Sessions</Tab>
          <Tab value="tasks">Assigned tasks</Tab>
        </TabList>

        <TabPanel value="overview" className="flex flex-col gap-8 py-6">
          <section className="flex flex-col gap-3">
            <Small className="font-medium text-foreground">Projects</Small>
            {data.projects.length === 0 ? (
              <EmptyState icon={<FolderKanban />} title="Not on any projects yet" className="py-6" />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                    className="focus-ring flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-fast hover:bg-surface-hover"
                  >
                    <span className="min-w-0 flex-1 truncate text-small font-medium text-foreground">
                      {project.name}
                      {project.isOwner && <span className="ml-1.5 text-caption text-subtle-foreground">(owner)</span>}
                    </span>
                    <ProjectStatus status={project.status} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <Small className="font-medium text-foreground">Recent sessions</Small>
            {data.sessions.length === 0 ? (
              <EmptyState title="No sessions attended yet" className="py-6" />
            ) : (
              <List>
                {data.sessions.slice(0, 5).map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </List>
            )}
          </section>
        </TabPanel>

        <TabPanel value="projects" className="py-6">
          {data.projects.length === 0 ? (
            <EmptyState icon={<FolderKanban />} title="Not on any projects yet" className="py-8" />
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
            <EmptyState title="No sessions attended yet" className="py-8" />
          ) : (
            <List>
              {data.sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value="tasks" className="py-6">
          <SessionTaskList tasks={data.tasks} onStatusChange={() => toast({ title: 'Open the Tasks page to change status' })} />
        </TabPanel>
      </Tabs>
    </PageContainer>
  )
}
