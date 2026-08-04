import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { Tab, TabList, TabPanel, Tabs } from '@/components/navigation/tabs'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { Skeleton } from '@/components/feedback/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'
import { useSessionDetailData } from '@/data/sessions/use-session-detail-data'
import { DecisionList, SessionHeader, SessionOverview, SessionTaskList, TranscriptView } from '@/components/sessions'
import type { SessionTimelineItem } from '@/data/sessions/types'
import type { TaskStatusValue } from '@/components/recall/task-status'
import { isLiveMode } from '@/data/live/data-mode'
import { LiveSessionReviewPage } from './session-review-live'

export function SessionReviewPage() {
  // Live mode reads the real session + AI review from Firestore; demo mode uses sample data.
  return isLiveMode ? <LiveSessionReviewPage /> : <DemoSessionReviewPage />
}

const TASK_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Completed' },
]

function DemoSessionReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, refetch, approveDecision, rejectDecision, changeTaskStatus } = useSessionDetailData(sessionId)

  const [tab, setTab] = useState(searchParams.get('tab') === 'transcript' ? 'transcript' : 'overview')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [taskFilter, setTaskFilter] = useState<'all' | 'open' | 'done'>('all')

  function handleTimelineClick(item: SessionTimelineItem) {
    if (state.status !== 'success') return
    const nearest = [...state.data.transcript].sort(
      (a, b) => Math.abs(a.offsetMinutes - item.offsetMinutes) - Math.abs(b.offsetMinutes - item.offsetMinutes),
    )[0]
    if (!nearest) {
      toast({ title: 'Playback coming later', description: "Jumping to audio isn't wired up yet in this demo." })
      return
    }
    setActiveEntryId(nearest.id)
    setTab('transcript')
    requestAnimationFrame(() => {
      document.getElementById(`transcript-${nearest.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const filteredTasks = useMemo(() => {
    if (state.status !== 'success') return []
    if (taskFilter === 'open') return state.data.tasks.filter((t) => t.status !== 'done' && t.status !== 'canceled')
    if (taskFilter === 'done') return state.data.tasks.filter((t) => t.status === 'done')
    return state.data.tasks
  }, [state, taskFilter])

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
        <ErrorState title="We couldn't load this session" onRetry={refetch} onBack={() => navigate('/app/sessions')} />
      </PageContainer>
    )
  }

  if (state.status === 'not-found') {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertTriangle />}
          title="Session not found"
          description="This session may have been removed, or the link is incorrect."
          action={
            <Button variant="secondary" onClick={() => navigate('/app/sessions')}>
              Back to Sessions
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
      <SessionHeader session={data} />

      <Tabs value={tab} defaultValue="overview" onValueChange={setTab}>
        <TabList className="overflow-x-auto">
          <Tab value="overview">Overview</Tab>
          <Tab value="transcript">Transcript</Tab>
          <Tab value="tasks">Tasks</Tab>
          <Tab value="decisions">Decisions</Tab>
        </TabList>

        <TabPanel value="overview" className="py-6">
          <SessionOverview
            session={data}
            onApproveDecision={handleApprove}
            onRejectDecision={handleReject}
            onTaskStatusChange={handleTaskStatusChange}
            onTimelineClick={handleTimelineClick}
          />
        </TabPanel>

        <TabPanel value="transcript" className="py-6">
          <TranscriptView entries={data.transcript} activeEntryId={activeEntryId} />
        </TabPanel>

        <TabPanel value="tasks" className="flex flex-col gap-4 py-6">
          <SegmentedControl
            aria-label="Filter tasks"
            value={taskFilter}
            onChange={(v) => setTaskFilter(v as typeof taskFilter)}
            options={TASK_FILTERS}
            size="sm"
            className="w-fit"
          />
          <SessionTaskList tasks={filteredTasks} onStatusChange={handleTaskStatusChange} />
        </TabPanel>

        <TabPanel value="decisions" className="py-6">
          <DecisionList decisions={data.decisions} onApprove={handleApprove} onReject={handleReject} />
        </TabPanel>
      </Tabs>
    </PageContainer>
  )
}
