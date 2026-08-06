import type { DevCategory, DevPriority, DevUser, DevelopmentTask } from './types'

/** The named views in the filter bar. */
export type DevTaskView = 'all' | 'available' | 'mine' | 'reserved' | 'in_progress' | 'completed'

export const DEV_TASK_VIEWS: { id: DevTaskView; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'mine', label: 'Mine' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

export interface DevTaskFilters {
  view: DevTaskView
  category: DevCategory | 'all'
  priority: DevPriority | 'all'
  person: DevUser | 'all'
  query: string
}

export const INITIAL_FILTERS: DevTaskFilters = {
  view: 'all',
  category: 'all',
  priority: 'all',
  person: 'all',
  query: '',
}

/** Does a task belong to the given named view, relative to the current user? */
export function matchesView(task: DevelopmentTask, view: DevTaskView, me: DevUser | null): boolean {
  switch (view) {
    case 'available':
      return task.status === 'backlog' && !task.reserved_by
    case 'mine':
      return me != null && task.reserved_by === me && task.status !== 'completed'
    case 'reserved':
      return task.status === 'reserved'
    case 'in_progress':
      return task.status === 'in_progress'
    case 'completed':
      return task.status === 'completed'
    case 'all':
    default:
      return true
  }
}

const PRIORITY_ORDER: Record<DevPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

/**
 * Applies every active filter, then sorts: open tasks before completed, then by priority, then by
 * the stored `order`. Pure — the page passes its filter state and the current identity.
 */
export function filterDevTasks(tasks: DevelopmentTask[], filters: DevTaskFilters, me: DevUser | null): DevelopmentTask[] {
  const q = filters.query.trim().toLowerCase()
  return tasks
    .filter((t) => matchesView(t, filters.view, me))
    .filter((t) => filters.category === 'all' || t.category === filters.category)
    .filter((t) => filters.priority === 'all' || t.priority === filters.priority)
    .filter((t) => filters.person === 'all' || t.reserved_by === filters.person)
    .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
    .slice()
    .sort((a, b) => {
      const ac = a.status === 'completed' ? 1 : 0
      const bc = b.status === 'completed' ? 1 : 0
      if (ac !== bc) return ac - bc
      if (PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      return a.order - b.order
    })
}

export interface DevTaskStats {
  total: number
  remaining: number
  inProgress: number
  completed: number
  uvejsReserved: number
  lorikReserved: number
}

/** Board totals for the compact progress row. `remaining` = everything not completed. */
export function computeDevTaskStats(tasks: DevelopmentTask[]): DevTaskStats {
  const stats: DevTaskStats = { total: tasks.length, remaining: 0, inProgress: 0, completed: 0, uvejsReserved: 0, lorikReserved: 0 }
  for (const t of tasks) {
    if (t.status === 'completed') stats.completed++
    else stats.remaining++
    if (t.status === 'in_progress') stats.inProgress++
    if (t.reserved_by === 'uvejs' && t.status !== 'completed') stats.uvejsReserved++
    if (t.reserved_by === 'lorik' && t.status !== 'completed') stats.lorikReserved++
  }
  return stats
}
