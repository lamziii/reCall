import { useMemo, useState } from 'react'
import { ChevronDown, ListChecks, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SegmentedControl, Select, SearchInput } from '@/components/forms'
import { Skeleton } from '@/components/feedback/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Progress } from '@/components/feedback/progress'
import { useToast } from '@/components/feedback/toast'
import { Avatar } from '@/components/data-display/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/app/theme/theme-toggle'
import { useDevTasks } from '@/data/dev-tasks/use-dev-tasks'
import {
  completeDevTask,
  createDevTask,
  deleteAllDevTasks,
  deleteDevTask,
  DevTaskConflictError,
  releaseDevTask,
  reopenDevTask,
  reserveDevTask,
  startDevTask,
  takeOverDevTask,
  updateDevTask,
} from '@/data/dev-tasks/dev-tasks-store'
import { computeDevTaskStats, DEV_TASK_VIEWS, filterDevTasks, INITIAL_FILTERS, type DevTaskFilters } from '@/data/dev-tasks/filters'
import { clearIdentity, getIdentity, setIdentity } from '@/data/dev-tasks/identity'
import {
  DEV_CATEGORIES,
  DEV_CATEGORY_LABELS,
  DEV_PRIORITIES,
  DEV_PRIORITY_LABELS,
  DEV_USERS,
  devUserName,
  type DevUser,
  type DevelopmentTask,
} from '@/data/dev-tasks/types'
import { IdentityDialog } from './identity-dialog'
import { TaskFormDialog, type TaskFormSubmit } from './task-form-dialog'
import { TaskRow, type DevTaskAction } from './task-row'

const CATEGORY_FILTER_OPTIONS = [{ value: 'all', label: 'All categories' }, ...DEV_CATEGORIES.map((c) => ({ value: c, label: DEV_CATEGORY_LABELS[c] }))]
const PRIORITY_FILTER_OPTIONS = [{ value: 'all', label: 'All priorities' }, ...DEV_PRIORITIES.map((p) => ({ value: p, label: DEV_PRIORITY_LABELS[p] }))]
const PERSON_FILTER_OPTIONS = [{ value: 'all', label: 'Anyone' }, ...DEV_USERS.map((u) => ({ value: u.id, label: u.name }))]

/**
 * Internal development task board (`/tasks`) — the shared build backlog for Uvejs & Lorik. Distinct
 * from the customer meeting-action board at `/app/tasks`. Realtime shared Firestore data; identity
 * is a device-local attribution label, not auth (the route is already auth-gated).
 */
export function DevTaskboardPage() {
  const { toast } = useToast()
  const { state, retry } = useDevTasks()
  const [me, setMe] = useState<DevUser | null>(() => getIdentity())
  const [filters, setFilters] = useState<DevTaskFilters>(INITIAL_FILTERS)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DevelopmentTask | null>(null)
  const [confirm, setConfirm] = useState<{ action: 'delete' | 'takeover'; task: DevelopmentTask } | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const tasks = state.status === 'ready' ? state.tasks : []
  const stats = useMemo(() => computeDevTaskStats(tasks), [tasks])
  const visible = useMemo(() => filterDevTasks(tasks, filters, me), [tasks, filters, me])

  function chooseIdentity(user: DevUser) {
    setIdentity(user)
    setMe(user)
  }

  function patchFilter(patch: Partial<DevTaskFilters>) {
    setFilters((f) => ({ ...f, ...patch }))
  }

  // ---- Action dispatch (with atomic reserve/takeover + friendly conflict feedback) ----
  async function runAction(action: DevTaskAction, task: DevelopmentTask) {
    if (!me) return
    if (action === 'edit') {
      setEditing(task)
      setFormOpen(true)
      return
    }
    if (action === 'delete' || action === 'takeover') {
      setConfirm({ action, task })
      return
    }
    setBusyId(task.id)
    try {
      if (action === 'reserve') await reserveDevTask(task.id, me)
      else if (action === 'start') await startDevTask(task.id)
      else if (action === 'release') await releaseDevTask(task.id)
      else if (action === 'complete') await completeDevTask(task.id, me)
      else if (action === 'reopen') await reopenDevTask(task.id)
    } catch (err) {
      if (err instanceof DevTaskConflictError) {
        toast({ title: 'Already taken', description: err.message, variant: 'warning' })
      } else {
        toast({ title: "Couldn't update the task", description: 'Please try again.', variant: 'danger' })
      }
    } finally {
      setBusyId(null)
    }
  }

  async function confirmAction() {
    if (!confirm || !me) return
    const { action, task } = confirm
    setBusyId(task.id)
    try {
      if (action === 'delete') {
        await deleteDevTask(task.id)
        toast({ title: 'Task deleted' })
      } else {
        await takeOverDevTask(task.id, me)
        toast({ title: `Taken over from ${devUserName(task.reserved_by)}`, variant: 'success' })
      }
    } catch {
      toast({ title: "Couldn't complete that", description: 'Please try again.', variant: 'danger' })
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  async function clearAll() {
    setClearing(true)
    try {
      await deleteAllDevTasks()
      toast({ title: 'All tasks cleared', description: 'The board is empty — add your own tasks.', variant: 'success' })
    } catch {
      toast({ title: "Couldn't clear the tasks", description: 'Check your connection and try again.', variant: 'danger' })
    } finally {
      setClearing(false)
      setClearAllOpen(false)
    }
  }

  async function submitForm(payload: TaskFormSubmit) {
    if (!me) return
    if (editing) {
      await updateDevTask(editing.id, payload.input)
      toast({ title: 'Task updated', variant: 'success' })
    } else {
      const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order), 0)
      await createDevTask(payload.input, me, {
        order: maxOrder + 10,
        assignTo: payload.assignToMe ? me : null,
        start: payload.startNow,
      })
      toast({ title: 'Task created', variant: 'success' })
    }
  }

  return (
    <div className="min-h-dvh w-full bg-bg text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <Header
          me={me}
          stats={{ remaining: stats.remaining, completed: stats.completed }}
          onAdd={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          onSwitch={() => {
            clearIdentity()
            setMe(null)
          }}
          onClearAll={() => setClearAllOpen(true)}
          hasTasks={tasks.length > 0}
          canAdd={Boolean(me) && state.status === 'ready'}
        />

        {me && <ProgressRow stats={stats} />}

        {me && (
          <Filters
            filters={filters}
            patch={patchFilter}
          />
        )}

        {/* Body */}
        {state.status === 'loading' && <ListSkeleton />}
        {state.status === 'error' && (
          <ErrorState title="We couldn't load the board" description="Check your connection and try again." onRetry={retry} className="py-20" />
        )}
        {state.status === 'ready' && me && (
          visible.length === 0 ? (
            <EmptyState
              icon={<ListChecks />}
              title={tasks.length === 0 ? 'No tasks yet' : 'Nothing matches these filters'}
              description={tasks.length === 0 ? 'Add the first development task to get started.' : 'Try clearing a filter or searching for something else.'}
              className="py-20"
            />
          ) : (
            <div className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-1">
              {visible.map((task) => (
                <TaskRow key={task.id} task={task} me={me} busy={busyId === task.id} onAction={runAction} />
              ))}
            </div>
          )
        )}
      </div>

      <IdentityDialog open={!me} onSelect={chooseIdentity} />

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editing} onSubmit={submitForm} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.action === 'delete' ? 'Delete this task?' : 'Take over this task?'}
        description={
          confirm?.action === 'delete'
            ? 'This permanently removes the task from the board for everyone.'
            : `This reassigns "${confirm?.task.title}" from ${devUserName(confirm?.task.reserved_by)} to you.`
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete' : 'Take over'}
        variant={confirm?.action === 'delete' ? 'danger' : 'default'}
        onConfirm={confirmAction}
      />

      <ConfirmDialog
        open={clearAllOpen}
        onOpenChange={(open) => !clearing && setClearAllOpen(open)}
        title="Delete every task?"
        description="This permanently removes all development tasks for both of you. The default backlog will not come back — you'll start from an empty board."
        confirmLabel={clearing ? 'Clearing…' : 'Delete all'}
        variant="danger"
        onConfirm={clearAll}
      />
    </div>
  )
}

function Header({
  me,
  stats,
  onAdd,
  onSwitch,
  onClearAll,
  hasTasks,
  canAdd,
}: {
  me: DevUser | null
  stats: { remaining: number; completed: number }
  onAdd: () => void
  onSwitch: () => void
  onClearAll: () => void
  hasTasks: boolean
  canAdd: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-body font-semibold tracking-tight text-foreground">Recall</span>
          <span className="text-subtle-foreground" aria-hidden>/</span>
          <span className="text-body font-medium text-foreground">Development Tasks</span>
        </div>
        <span className="text-caption text-subtle-foreground">
          {stats.remaining} remaining · {stats.completed} completed · internal tool
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {me && (
          <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={onAdd} disabled={!canAdd}>
            Add task
          </Button>
        )}
        {me && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <button type="button" className="focus-ring flex items-center gap-1.5 rounded-full border border-border-subtle py-1 pl-1 pr-2 hover:bg-surface-hover" aria-label="Switch user">
                <Avatar name={devUserName(me)} size="sm" />
                <span className="text-small font-medium text-foreground">{devUserName(me)}</span>
                <ChevronDown className="size-3.5 text-subtle-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent placement="bottom-end">
              <DropdownMenuLabel>Signed in as {devUserName(me)}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSwitch}>Switch user</DropdownMenuItem>
              {hasTasks && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem danger icon={<Trash2 className="size-4" />} onSelect={onClearAll}>
                    Clear all tasks…
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function ProgressRow({ stats }: { stats: ReturnType<typeof computeDevTaskStats> }) {
  const pct = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
  return (
    <div className="flex flex-col gap-2">
      <Progress value={pct} label="Development progress" className="h-1" />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-subtle-foreground">
        <span>{stats.total} total</span>
        <span>{stats.remaining} remaining</span>
        <span>{stats.inProgress} in progress</span>
        <span>{stats.completed} completed</span>
        <span>Uvejs: {stats.uvejsReserved}</span>
        <span>Lorik: {stats.lorikReserved}</span>
      </div>
    </div>
  )
}

function Filters({ filters, patch }: { filters: DevTaskFilters; patch: (patch: Partial<DevTaskFilters>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl
        aria-label="View"
        size="sm"
        options={DEV_TASK_VIEWS.map((v) => ({ value: v.id, label: v.label }))}
        value={filters.view}
        onChange={(value) => patch({ view: value as DevTaskFilters['view'] })}
        className="w-fit max-w-full overflow-x-auto"
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.query}
          onChange={(e) => patch({ query: e.target.value })}
          onClear={() => patch({ query: '' })}
          placeholder="Search tasks…"
          className="h-9 w-full max-w-xs"
        />
        <Select
          size="sm"
          options={CATEGORY_FILTER_OPTIONS}
          value={filters.category}
          onChange={(e) => patch({ category: e.target.value as DevTaskFilters['category'] })}
          className="w-auto"
          aria-label="Filter by category"
        />
        <Select
          size="sm"
          options={PRIORITY_FILTER_OPTIONS}
          value={filters.priority}
          onChange={(e) => patch({ priority: e.target.value as DevTaskFilters['priority'] })}
          className="w-auto"
          aria-label="Filter by priority"
        />
        <Select
          size="sm"
          options={PERSON_FILTER_OPTIONS}
          value={filters.person}
          onChange={(e) => patch({ person: e.target.value as DevTaskFilters['person'] })}
          className="w-auto"
          aria-label="Filter by person"
        />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-7 w-20" />
        </div>
      ))}
    </div>
  )
}
