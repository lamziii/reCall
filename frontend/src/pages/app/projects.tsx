import { useMemo, useState } from 'react'
import { FolderKanban, Plus, Search as SearchIcon, Upload } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { List } from '@/components/data-display/list'
import { useToast } from '@/components/feedback/toast'
import { useProjectsListData } from '@/data/projects/use-projects-list-data'
import { ProjectCard, ProjectRow, ProjectsToolbar } from '@/components/projects'
import type { ProjectSortOption, ProjectStatusFilter, ProjectView } from '@/data/projects/types'

export function ProjectsPage() {
  const { toast } = useToast()
  const { state, refetch } = useProjectsListData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatusFilter>('all')
  const [ownerId, setOwnerId] = useState('all')
  const [sort, setSort] = useState<ProjectSortOption>('updated')
  const [view, setView] = useState<ProjectView>('grid')

  const hasActiveFilters = search.trim() !== '' || status !== 'all' || ownerId !== 'all'

  function clearFilters() {
    setSearch('')
    setStatus('all')
    setOwnerId('all')
  }

  function placeholderAction(label: string) {
    toast({ title: label, description: "This is a placeholder for the hackathon demo — it's not wired up to a backend yet." })
  }

  const filteredSorted = useMemo(() => {
    if (state.status !== 'success') return []
    const query = search.trim().toLowerCase()

    const list = state.data.projects.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (ownerId !== 'all' && p.ownerId !== ownerId) return false
      if (query && !`${p.name} ${p.description}`.toLowerCase().includes(query)) return false
      return true
    })

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'progress':
          return b.progressPct - a.progressPct
        case 'target-date':
          return new Date(a.targetDateRaw).getTime() - new Date(b.targetDateRaw).getTime()
        case 'updated':
        default:
          return new Date(b.updatedRaw).getTime() - new Date(a.updatedRaw).getTime()
      }
    })
  }, [state, search, status, ownerId, sort])

  const actions = (
    <>
      <Button variant="ghost" leftIcon={<Upload />} onClick={() => placeholderAction('Import')}>
        Import
      </Button>
      <Button leftIcon={<Plus />} onClick={() => placeholderAction('New Project')}>
        New Project
      </Button>
    </>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Projects" description="Everything your team is working on, connected to conversations." actions={actions} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="Projects" description="Everything your team is working on, connected to conversations." actions={actions} />
        <ErrorState title="We couldn't load your projects" onRetry={refetch} />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="Projects" description="Everything your team is working on, connected to conversations." actions={actions} />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<FolderKanban />}
            title="No projects yet"
            description="Projects organize conversations into long-term work."
            action={
              <div className="flex items-center gap-2">
                <Button onClick={() => placeholderAction('Create Project')}>Create Project</Button>
                <Button variant="secondary" onClick={() => placeholderAction('Import')}>
                  Import
                </Button>
              </div>
            }
          />
        </div>
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Everything your team is working on, connected to conversations."
        actions={actions}
        toolbar={
          <ProjectsToolbar
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            ownerId={ownerId}
            onOwnerChange={setOwnerId}
            ownerOptions={data.ownerOptions}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        }
      />

      {filteredSorted.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No projects match your filters"
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
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredSorted.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <List>
          {filteredSorted.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </List>
      )}
    </PageContainer>
  )
}
