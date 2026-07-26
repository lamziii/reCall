import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { Tab, TabList, TabPanel, Tabs } from '@/components/navigation/tabs'
import { Skeleton } from '@/components/feedback/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'
import { useProjectDetailData } from '@/data/projects/use-project-detail-data'
import { ProjectActivity, ProjectHeader, ProjectMembers, ProjectOverview, ProjectSettings } from '@/components/projects'
import type { TaskStatusValue } from '@/components/recall/task-status'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, refetch, approveDecision, rejectDecision, changeTaskStatus } = useProjectDetailData(projectId)
  const [tab, setTab] = useState('overview')

  function handleTaskStatusChange(taskId: string, status: TaskStatusValue) {
    changeTaskStatus(taskId, status)
    toast({ title: 'Task updated', variant: 'success' })
  }

  function handleApprove(id: string) {
    approveDecision(id)
    toast({ title: 'Decision approved', variant: 'success' })
  }

  function handleReject(id: string) {
    rejectDecision(id)
    toast({ title: 'Decision rejected' })
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
        <ErrorState title="We couldn't load this project" onRetry={refetch} onBack={() => navigate('/app/projects')} />
      </PageContainer>
    )
  }

  if (state.status === 'not-found') {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertTriangle />}
          title="Project not found"
          description="This project may have been removed, or the link is incorrect."
          action={
            <Button variant="secondary" onClick={() => navigate('/app/projects')}>
              Back to Projects
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
      <ProjectHeader project={data} />

      <Tabs value={tab} defaultValue="overview" onValueChange={setTab}>
        <TabList className="overflow-x-auto">
          <Tab value="overview">Overview</Tab>
          <Tab value="activity">Activity</Tab>
          <Tab value="members">Members</Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>

        <TabPanel value="overview" className="py-6">
          <ProjectOverview
            project={data}
            onApproveDecision={handleApprove}
            onRejectDecision={handleReject}
            onTaskStatusChange={handleTaskStatusChange}
          />
        </TabPanel>

        <TabPanel value="activity" className="py-6">
          <ProjectActivity timeline={data.timeline} />
        </TabPanel>

        <TabPanel value="members" className="py-6">
          <ProjectMembers members={data.members} />
        </TabPanel>

        <TabPanel value="settings" className="py-6">
          <ProjectSettings project={data} />
        </TabPanel>
      </Tabs>
    </PageContainer>
  )
}
