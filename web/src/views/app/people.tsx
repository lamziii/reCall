import { useMemo, useState } from 'react'
import { Search as SearchIcon, Users, X } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { SearchInput } from '@/components/forms/search-input'
import { Select } from '@/components/forms/select'
import { useToast } from '@/components/feedback/toast'
import { usePeopleListData } from '@/data/people/use-people-list-data'
import { PersonCard } from '@/components/people/person-card'

export function PeoplePage() {
  const { toast } = useToast()
  const { state, refetch } = usePeopleListData()
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('all')

  const hasActiveFilters = search.trim() !== '' || department !== 'all'

  function clearFilters() {
    setSearch('')
    setDepartment('all')
  }

  const filtered = useMemo(() => {
    if (state.status !== 'success') return []
    const query = search.trim().toLowerCase()
    return state.data.people.filter((p) => {
      if (department !== 'all' && p.department !== department) return false
      if (query && !`${p.name} ${p.role} ${p.email}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [state, search, department])

  const actions = (
    <Button onClick={() => toast({ title: 'Invite people', description: "This is a placeholder for the hackathon demo — it's not wired up to a backend yet." })}>
      Invite people
    </Button>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="People" description="Everyone in your workspace." actions={actions} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="People" description="Everyone in your workspace." actions={actions} />
        <ErrorState title="We couldn't load your people directory" onRetry={refetch} />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="People" description="Everyone in your workspace." actions={actions} />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={<Users />} title="No people yet" description="Invite teammates to start collaborating in Recall." action={actions} />
        </div>
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer>
      <PageHeader
        title="People"
        description="Everyone in your workspace."
        actions={actions}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search people..."
              className="w-full sm:w-64"
            />
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={[{ value: 'all', label: 'All departments' }, ...data.departmentOptions.map((d) => ({ value: d, label: d }))]}
              size="sm"
              aria-label="Filter by department"
              className="w-auto min-w-36"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" leftIcon={<X />} onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No people match your filters"
          description="Try a different search or clear filters to see everyone."
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
