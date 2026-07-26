import { X } from 'lucide-react'
import { SearchInput } from '@/components/forms/search-input'
import { Select } from '@/components/forms/select'
import { Button } from '@/components/ui/button'
import type { TaskAssigneeFilter, TaskPriorityFilter, TaskSortOption, TaskStatusFilter } from '@/data/tasks/types'

const STATUS_OPTIONS: { value: TaskStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'canceled', label: 'Canceled' },
]

const PRIORITY_OPTIONS: { value: TaskPriorityFilter; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const SORT_OPTIONS: { value: TaskSortOption; label: string }[] = [
  { value: 'due-soonest', label: 'Due soonest' },
  { value: 'due-latest', label: 'Due latest' },
  { value: 'priority', label: 'Priority' },
  { value: 'recent', label: 'Recently added' },
]

export interface TasksToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: TaskStatusFilter
  onStatusChange: (value: TaskStatusFilter) => void
  priority: TaskPriorityFilter
  onPriorityChange: (value: TaskPriorityFilter) => void
  assignee: TaskAssigneeFilter
  onAssigneeChange: (value: TaskAssigneeFilter) => void
  assigneeOptions: { id: string; name: string }[]
  sort: TaskSortOption
  onSortChange: (value: TaskSortOption) => void
  hasActiveFilters: boolean
  onClear: () => void
}

export function TasksToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  assigneeOptions,
  sort,
  onSortChange,
  hasActiveFilters,
  onClear,
}: TasksToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search tasks, projects..."
        className="w-full sm:w-64"
      />
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TaskStatusFilter)}
        options={STATUS_OPTIONS}
        size="sm"
        aria-label="Filter by status"
        className="w-auto min-w-36"
      />
      <Select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriorityFilter)}
        options={PRIORITY_OPTIONS}
        size="sm"
        aria-label="Filter by priority"
        className="w-auto min-w-32"
      />
      <Select
        value={assignee}
        onChange={(e) => onAssigneeChange(e.target.value)}
        options={[{ value: 'all', label: 'Everyone' }, { value: 'unassigned', label: 'Unassigned' }, ...assigneeOptions.map((p) => ({ value: p.id, label: p.name }))]}
        size="sm"
        aria-label="Filter by assignee"
        className="w-auto min-w-32"
      />
      <Select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as TaskSortOption)}
        options={SORT_OPTIONS}
        size="sm"
        aria-label="Sort tasks"
        className="w-auto min-w-36 sm:ml-auto"
      />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" leftIcon={<X />} onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
