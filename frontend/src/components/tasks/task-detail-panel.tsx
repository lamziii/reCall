import { useNavigate } from 'react-router-dom'
import { FolderKanban, Mic } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select } from '@/components/forms/select'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { Assignee } from '@/components/recall/assignee'
import { DueDate } from '@/components/recall/due-date'
import { Divider } from '@/components/data-display/divider'
import { Body, Caption, Label, Small } from '@/components/typography'
import { buildTaskDetailPreview } from '@/data/tasks/task-detail-preview'
import type { TaskListItem } from '@/data/tasks/types'
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
  /** The selected task from the (live or demo) list, or null when the panel is closed. */
  task: TaskListItem | null
  onOpenChange: (open: boolean) => void
  onStatusChange: (taskId: string, status: TaskStatusValue) => void
}

export function TaskDetailPanel({ task, onOpenChange, onStatusChange }: TaskDetailPanelProps) {
  const navigate = useNavigate()
  // Detail is derived synchronously from the list item (+ dummy-enriched fields) — works in live
  // mode, where the list comes from Firestore, without a separate lookup that could 404.
  const detail = task ? buildTaskDetailPreview(task) : null

  return (
    <Sheet open={Boolean(task)} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-label="Task details" className="w-full max-w-md overflow-y-auto">
        {detail ? (
          <div className="flex flex-col gap-6">
            <SheetHeader>
              <SheetTitle>{detail.title}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={detail.status}
                onChange={(e) => onStatusChange(detail.id, e.target.value as TaskStatusValue)}
                options={STATUS_OPTIONS}
                size="sm"
                aria-label="Task status"
                className="w-auto"
              />
              <PriorityBadge priority={detail.priority} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label as="span">Description</Label>
              <Body className="text-foreground">{detail.description}</Body>
            </div>

            <Divider />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label as="span">Owner</Label>
                <Assignee name={detail.assigneeName} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label as="span">Due date</Label>
                <DueDate date={detail.dueDateRaw ? new Date(detail.dueDateRaw) : undefined} />
              </div>
            </div>

            {(detail.projectName || detail.sessionTitle) && (
              <>
                <Divider />
                <div className="flex flex-col gap-3">
                  {detail.projectName && detail.projectId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/app/projects/${detail.projectId}`)}
                      className="focus-ring flex items-center gap-2 rounded-md text-left text-small text-foreground transition-fast hover:text-accent"
                    >
                      <FolderKanban className="size-4 shrink-0 text-subtle-foreground" />
                      {detail.projectName}
                    </button>
                  )}
                  {detail.sessionTitle && detail.sourceSessionId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/app/sessions/${detail.sourceSessionId}`)}
                      className="focus-ring flex items-center gap-2 rounded-md text-left text-small text-foreground transition-fast hover:text-accent"
                    >
                      <Mic className="size-4 shrink-0 text-subtle-foreground" />
                      {detail.sessionTitle}
                    </button>
                  )}
                </div>
              </>
            )}

            {detail.conversationExcerpt && (
              <>
                <Divider />
                <div className="flex flex-col gap-1.5">
                  <Label as="span">Created from meeting</Label>
                  <blockquote className="rounded-lg border border-border-subtle bg-surface p-3">
                    <Small className="italic text-foreground">"{detail.conversationExcerpt.text}"</Small>
                    <Caption className="mt-1 block text-subtle-foreground">— {detail.conversationExcerpt.speakerName}</Caption>
                  </blockquote>
                </div>
              </>
            )}

            <Divider />

            <div className="flex flex-col gap-2.5">
              <Label as="span">Activity</Label>
              <div className="flex flex-col gap-3">
                {detail.activity.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-0.5">
                    <Small className="text-foreground">{entry.label}</Small>
                    <Caption className="text-subtle-foreground">{entry.timestampLabel}</Caption>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
