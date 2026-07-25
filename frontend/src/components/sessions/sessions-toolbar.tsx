import { X } from 'lucide-react'
import { SearchInput } from '@/components/forms/search-input'
import { Select } from '@/components/forms/select'
import { Button } from '@/components/ui/button'
import type { SessionDateFilter, SessionSortOption, SessionStatusFilter } from '@/data/sessions/types'

const STATUS_OPTIONS: { value: SessionStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'processing', label: 'Processing' },
  { value: 'scheduled', label: 'Scheduled' },
]

const DATE_OPTIONS: { value: SessionDateFilter; label: string }[] = [
  { value: 'all', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

const SORT_OPTIONS: { value: SessionSortOption; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'longest', label: 'Longest' },
  { value: 'shortest', label: 'Shortest' },
  { value: 'attention', label: 'Needs attention' },
]

export interface SessionsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: SessionStatusFilter
  onStatusChange: (value: SessionStatusFilter) => void
  projectId: string
  onProjectChange: (value: string) => void
  projectOptions: { id: string; name: string }[]
  dateFilter: SessionDateFilter
  onDateFilterChange: (value: SessionDateFilter) => void
  sort: SessionSortOption
  onSortChange: (value: SessionSortOption) => void
  hasActiveFilters: boolean
  onClear: () => void
}

export function SessionsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  projectId,
  onProjectChange,
  projectOptions,
  dateFilter,
  onDateFilterChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClear,
}: SessionsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search sessions, projects, people..."
        className="w-full sm:w-64"
      />
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as SessionStatusFilter)}
        options={STATUS_OPTIONS}
        size="sm"
        aria-label="Filter by status"
        className="w-auto min-w-36"
      />
      <Select
        value={projectId}
        onChange={(e) => onProjectChange(e.target.value)}
        options={[{ value: 'all', label: 'All projects' }, ...projectOptions.map((p) => ({ value: p.id, label: p.name }))]}
        size="sm"
        aria-label="Filter by project"
        className="w-auto min-w-36"
      />
      <Select
        value={dateFilter}
        onChange={(e) => onDateFilterChange(e.target.value as SessionDateFilter)}
        options={DATE_OPTIONS}
        size="sm"
        aria-label="Filter by date"
        className="w-auto min-w-32"
      />
      <Select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SessionSortOption)}
        options={SORT_OPTIONS}
        size="sm"
        aria-label="Sort sessions"
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
