import { useMemo, useState } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { CheckSquare, Mic, Plus, Search as SearchIcon } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/data-display/table'
import { Assignee } from '@/components/recall/assignee'
import { DueDate } from '@/components/recall/due-date'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { TaskStatus } from '@/components/recall/task-status'
import { Caption } from '@/components/typography'
import { useToast } from '@/components/feedback/toast'
import { useTasksListData } from '@/data/tasks/use-tasks-list-data'
import { TasksToolbar } from '@/components/tasks/tasks-toolbar'
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel'
import { NewTaskDialog } from '@/components/tasks/new-task-dialog'
import type { TaskAssigneeFilter, TaskListItem, TaskPriorityFilter, TaskSortOption, TaskStatusFilter } from '@/data/tasks/types'

const PRIORITY_WEIGHT: Record<TaskListItem['priority'], number> = { urgent: 3, high: 2, medium: 1, low: 0 }

export function TasksPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { state, refetch, changeTaskStatus } = useTasksListData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TaskStatusFilter>('all')
  const [priority, setPriority] = useState<TaskPriorityFilter>('all')
  const [assignee, setAssignee] = useState<TaskAssigneeFilter>('all')
  const [sort, setSort] = useState<TaskSortOption>('due-soonest')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [newTaskOpen, setNewTaskOpen] = useState(false)

  const hasActiveFilters = search.trim() !== '' || status !== 'all' || priority !== 'all' || assignee !== 'all'

  function clearFilters() {
    setSearch('')
    setStatus('all')
    setPriority('all')
    setAssignee('all')
  }

  const filteredSorted = useMemo(() => {
    if (state.status !== 'success') return []
    const query = search.trim().toLowerCase()

    const list = state.data.tasks.filter((t) => {
      if (status !== 'all' && t.status !== status) return false
      if (priority !== 'all' && t.priority !== priority) return false
      if (assignee === 'unassigned' && t.assigneeId) return false
      if (assignee !== 'all' && assignee !== 'unassigned' && t.assigneeId !== assignee) return false
      if (query && !`${t.title} ${t.projectName ?? ''} ${t.assigneeName ?? ''}`.toLowerCase().includes(query)) return false
      return true
    })

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'due-latest':
          return new Date(b.dueDateRaw ?? 0).getTime() - new Date(a.dueDateRaw ?? 0).getTime()
        case 'priority':
          return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
        case 'recent':
          return b.id.localeCompare(a.id)
        case 'due-soonest':
        default:
          if (!a.dueDateRaw) return 1
          if (!b.dueDateRaw) return -1
          return new Date(a.dueDateRaw).getTime() - new Date(b.dueDateRaw).getTime()
      }
    })
  }, [state, search, status, priority, assignee, sort])

  function handleStatusChange(taskId: string, next: Parameters<typeof changeTaskStatus>[1]) {
    changeTaskStatus(taskId, next)
    toast({ title: 'Task updated', variant: 'success' })
  }

  const actions = (
    <Button leftIcon={<Plus />} onClick={() => setNewTaskOpen(true)}>
      New Task
    </Button>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Tasks" description="Everything that came out of your conversations." actions={actions} />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="Tasks" description="Everything that came out of your conversations." actions={actions} />
        <ErrorState title="We couldn't load your tasks" onRetry={refetch} />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="Tasks" description="Everything that came out of your conversations." actions={actions} />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={<CheckSquare />} title="No tasks yet" description="Tasks extracted from your meetings will appear here — or create one manually." />
        </div>
        <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Everything that came out of your conversations."
        actions={actions}
        toolbar={
          <TasksToolbar
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            priority={priority}
            onPriorityChange={setPriority}
            assignee={assignee}
            onAssigneeChange={setAssignee}
            assigneeOptions={data.assigneeOptions}
            sort={sort}
            onSortChange={setSort}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        }
      />

      {filteredSorted.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No tasks match your filters"
          description="Try a different search or clear filters to see everything."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
          className="py-16"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Session</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSorted.map((task) => (
              <TableRow key={task.id} className="cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                <TableCell className="max-w-64 truncate font-medium text-foreground" title={task.title}>
                  {task.title}
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground" title={task.projectName ?? undefined}>
                  {task.projectName ?? '—'}
                </TableCell>
                <TableCell>
                  <Assignee name={task.assigneeName} compact />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  <TaskStatus status={task.status} />
                </TableCell>
                <TableCell>
                  <DueDate date={task.dueDateRaw ? new Date(task.dueDateRaw) : undefined} />
                </TableCell>
                <TableCell>
                  {task.sessionTitle ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/app/sessions/${task.sourceSessionId}`)
                      }}
                      className="focus-ring inline-flex items-center gap-1.5 rounded-md text-small text-subtle-foreground transition-fast hover:text-accent"
                    >
                      <Mic className="size-3.5 shrink-0" />
                      <span className="max-w-32 truncate">{task.sessionTitle}</span>
                    </button>
                  ) : (
                    <Caption className="text-subtle-foreground">—</Caption>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TaskDetailPanel
        task={data.tasks.find((t) => t.id === selectedTaskId) ?? null}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
        onStatusChange={handleStatusChange}
      />
      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
    </PageContainer>
  )
}
