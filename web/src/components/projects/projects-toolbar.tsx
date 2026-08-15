import { LayoutGrid, List as ListIcon, X } from 'lucide-react'
import { SearchInput } from '@/components/forms/search-input'
import { Select } from '@/components/forms/select'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/forms/segmented-control'
import type { ProjectSortOption, ProjectStatusFilter, ProjectView } from '@/data/projects/types'

const STATUS_OPTIONS: { value: ProjectStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'at-risk', label: 'At risk' },
  { value: 'on-hold', label: 'On hold' },
  { value: 'done', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const SORT_OPTIONS: { value: ProjectSortOption; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'name', label: 'Name' },
  { value: 'progress', label: 'Progress' },
  { value: 'target-date', label: 'Target date' },
]

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: <LayoutGrid /> },
  { value: 'list', label: 'List', icon: <ListIcon /> },
]

export interface ProjectsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: ProjectStatusFilter
  onStatusChange: (value: ProjectStatusFilter) => void
  ownerId: string
  onOwnerChange: (value: string) => void
  ownerOptions: { id: string; name: string }[]
  sort: ProjectSortOption
  onSortChange: (value: ProjectSortOption) => void
  view: ProjectView
  onViewChange: (value: ProjectView) => void
  hasActiveFilters: boolean
  onClear: () => void
}

export function ProjectsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  ownerId,
  onOwnerChange,
  ownerOptions,
  sort,
  onSortChange,
  view,
  onViewChange,
  hasActiveFilters,
  onClear,
}: ProjectsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search projects..."
        className="w-full sm:w-64"
      />
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as ProjectStatusFilter)}
        options={STATUS_OPTIONS}
        size="sm"
        aria-label="Filter by status"
        className="w-auto min-w-36"
      />
      <Select
        value={ownerId}
        onChange={(e) => onOwnerChange(e.target.value)}
        options={[{ value: 'all', label: 'All owners' }, ...ownerOptions.map((o) => ({ value: o.id, label: o.name }))]}
        size="sm"
        aria-label="Filter by owner"
        className="w-auto min-w-32"
      />
      <Select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as ProjectSortOption)}
        options={SORT_OPTIONS}
        size="sm"
        aria-label="Sort projects"
        className="w-auto min-w-40 sm:ml-auto"
      />
      <SegmentedControl aria-label="Switch view" value={view} onChange={(v) => onViewChange(v as ProjectView)} options={VIEW_OPTIONS} size="sm" />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" leftIcon={<X />} onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
