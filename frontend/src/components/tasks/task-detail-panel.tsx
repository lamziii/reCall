import { useNavigate } from 'react-router-dom'
import { FolderKanban, Mic } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select } from '@/components/forms/select'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { Assignee } from '@/components/recall/assignee'
import { DueDate } from '@/components/recall/due-date'
import { Divider } from '@/components/data-display/divider'
import { Skeleton } from '@/components/feedback/skeleton'
import { Body, Caption, Label, Small } from '@/components/typography'
import { useTaskDetailData } from '@/data/tasks/use-task-detail-data'
import type { TaskStatusValue } from '@/components/recall/task-status'

const STATUS_OPTIONS: { value: TaskStatusValue; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
]

export interface TaskDetailPanelProps {
  taskId: string | null
  onOpenChange: (open: boolean) => void
  onStatusChange: (taskId: string, status: TaskStatusValue) => void
}

export function TaskDetailPanel({ taskId, onOpenChange, onStatusChange }: TaskDetailPanelProps) {
  const navigate = useNavigate()
  const { state } = useTaskDetailData(taskId)

  return (
    <Sheet open={Boolean(taskId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-label="Task details" className="w-full max-w-md overflow-y-auto">
        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : state.status === 'success' ? (
          <div className="flex flex-col gap-6">
            <SheetHeader>
              <SheetTitle>{state.data.title}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={state.data.status}
                onChange={(e) => onStatusChange(state.data.id, e.target.value as TaskStatusValue)}
                options={STATUS_OPTIONS}
                size="sm"
                aria-label="Task status"
                className="w-auto"
              />
              <PriorityBadge priority={state.data.priority} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label as="span">Description</Label>
              <Body className="text-foreground">{state.data.description}</Body>
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label as="span">Owner</Label>
                <Assignee name={state.data.assigneeName} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label as="span">Due date</Label>
                <DueDate date={state.data.dueDateRaw ? new Date(state.data.dueDateRaw) : undefined} />
              </div>
            </div>

            {(state.data.projectName || state.data.sessionTitle) && (
              <>
                <Divider />
                <div className="flex flex-col gap-3">
                  {state.data.projectName && state.data.projectId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/app/projects/${state.data.projectId}`)}
                      className="focus-ring flex items-center gap-2 rounded-md text-left text-small text-foreground transition-fast hover:text-accent"
                    >
                      <FolderKanban className="size-4 shrink-0 text-subtle-foreground" />
                      {state.data.projectName}
                    </button>
                  )}
                  {state.data.sessionTitle && state.data.sourceSessionId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/app/sessions/${state.data.sourceSessionId}`)}
                      className="focus-ring flex items-center gap-2 rounded-md text-left text-small text-foreground transition-fast hover:text-accent"
                    >
                      <Mic className="size-4 shrink-0 text-subtle-foreground" />
                      {state.data.sessionTitle}
                    </button>
                  )}
                </div>
              </>
            )}

            {state.data.conversationExcerpt && (
              <>
                <Divider />
                <div className="flex flex-col gap-1.5">
                  <Label as="span">Created from meeting</Label>
                  <blockquote className="rounded-lg border border-border-subtle bg-surface p-3">
                    <Small className="italic text-foreground">"{state.data.conversationExcerpt.text}"</Small>
                    <Caption className="mt-1 block text-subtle-foreground">— {state.data.conversationExcerpt.speakerName}</Caption>
                  </blockquote>
                </div>
              </>
            )}

            <Divider />

            <div className="flex flex-col gap-2.5">
              <Label as="span">Activity</Label>
              <div className="flex flex-col gap-3">
                {state.data.activity.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-0.5">
                    <Small className="text-foreground">{entry.label}</Small>
                    <Caption className="text-subtle-foreground">{entry.timestampLabel}</Caption>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Body className="text-muted-foreground">This task couldn't be found.</Body>
        )}
      </SheetContent>
    </Sheet>
  )
}
