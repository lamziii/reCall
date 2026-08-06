import { Check, MoreHorizontal, Pencil, Play, RotateCcw, Trash2, Undo2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  DEV_CATEGORY_LABELS,
  DEV_PRIORITY_LABELS,
  devUserName,
  type DevPriority,
  type DevUser,
  type DevelopmentTask,
} from '@/data/dev-tasks/types'

export type DevTaskAction = 'reserve' | 'start' | 'release' | 'complete' | 'reopen' | 'edit' | 'delete' | 'takeover'

const PRIORITY_DOT: Record<DevPriority, string> = {
  critical: 'bg-danger',
  high: 'bg-warning',
  medium: 'bg-subtle-foreground',
  low: 'bg-border-strong',
}

interface Props {
  task: DevelopmentTask
  me: DevUser
  busy: boolean
  onAction: (action: DevTaskAction, task: DevelopmentTask) => void
}

/** One compact row on the board. Primary action is a single button; the rest live in a ⋯ menu. */
export function TaskRow({ task, me, busy, onAction }: Props) {
  const mine = task.reserved_by === me
  const heldByOther = task.reserved_by != null && task.reserved_by !== me
  const completed = task.status === 'completed'

  return (
    <div
      className={cn(
        'flex items-start gap-3 border-b border-border-subtle px-1 py-3.5 last:border-b-0',
        completed && 'opacity-60',
      )}
    >
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority])} aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={cn('truncate text-small font-medium text-foreground', completed && 'line-through')}>{task.title}</span>
        </div>
        {task.description && <span className="line-clamp-1 text-caption text-muted-foreground">{task.description}</span>}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-caption text-subtle-foreground">
          <span>{DEV_CATEGORY_LABELS[task.category]}</span>
          <span aria-hidden>·</span>
          <span>{DEV_PRIORITY_LABELS[task.priority]}</span>
          <StatusText task={task} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <PrimaryAction task={task} mine={mine} heldByOther={heldByOther} busy={busy} onAction={onAction} />

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="sm" aria-label="More actions" className="px-2" disabled={busy}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent placement="bottom-end">
            {!completed && <DropdownMenuItem icon={<Pencil className="size-4" />} onSelect={() => onAction('edit', task)}>Edit</DropdownMenuItem>}
            {(task.status === 'reserved' || task.status === 'in_progress') && mine && (
              <DropdownMenuItem icon={<Undo2 className="size-4" />} onSelect={() => onAction('release', task)}>Release</DropdownMenuItem>
            )}
            {(task.status === 'reserved' || task.status === 'in_progress') && !mine && (
              <DropdownMenuItem icon={<UserPlus className="size-4" />} onSelect={() => onAction('takeover', task)}>Take over…</DropdownMenuItem>
            )}
            {completed && <DropdownMenuItem icon={<RotateCcw className="size-4" />} onSelect={() => onAction('reopen', task)}>Reopen</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={<Trash2 className="size-4" />} danger onSelect={() => onAction('delete', task)}>Delete…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function StatusText({ task }: { task: DevelopmentTask }) {
  if (task.status === 'completed') {
    return (
      <>
        <span aria-hidden>·</span>
        <span className="text-success">Completed{task.completed_by ? ` by ${devUserName(task.completed_by)}` : ''}</span>
      </>
    )
  }
  if (task.reserved_by) {
    const label = task.status === 'in_progress' ? 'In progress' : 'Reserved'
    return (
      <>
        <span aria-hidden>·</span>
        <span className="text-foreground">{label} · {devUserName(task.reserved_by)}</span>
      </>
    )
  }
  return null
}

function PrimaryAction({
  task,
  mine,
  heldByOther,
  busy,
  onAction,
}: {
  task: DevelopmentTask
  mine: boolean
  heldByOther: boolean
  busy: boolean
  onAction: (action: DevTaskAction, task: DevelopmentTask) => void
}) {
  if (task.status === 'completed') {
    return (
      <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="size-3.5" />} disabled={busy} onClick={() => onAction('reopen', task)}>
        Reopen
      </Button>
    )
  }
  if (task.status === 'backlog') {
    return (
      <Button variant="secondary" size="sm" disabled={busy} onClick={() => onAction('reserve', task)}>
        Reserve
      </Button>
    )
  }
  if (heldByOther) {
    // The other person holds it — no silent takeover; the ⋯ menu offers a confirmed "Take over".
    return (
      <Button variant="ghost" size="sm" disabled>
        Reserved by {devUserName(task.reserved_by)}
      </Button>
    )
  }
  // Mine: reserved → Start; in_progress → Complete.
  if (mine && task.status === 'reserved') {
    return (
      <Button variant="secondary" size="sm" leftIcon={<Play className="size-3.5" />} disabled={busy} onClick={() => onAction('start', task)}>
        Start
      </Button>
    )
  }
  return (
    <Button variant="primary" size="sm" leftIcon={<Check className="size-3.5" />} disabled={busy} onClick={() => onAction('complete', task)}>
      Complete
    </Button>
  )
}
