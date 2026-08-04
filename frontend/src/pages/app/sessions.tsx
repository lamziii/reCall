import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Mic, Search as SearchIcon, Upload } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { List } from '@/components/data-display/list'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Caption } from '@/components/typography'
import { useSessionsListData } from '@/data/sessions/use-sessions-list-data'
import { SessionRow, SessionsToolbar } from '@/components/sessions'
import type { SessionDateFilter, SessionDateGroup, SessionListItem, SessionSortOption, SessionStatusFilter } from '@/data/sessions/types'

const GROUP_LABEL: Record<SessionDateGroup, string> = {
  upcoming: 'Upcoming',
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This week',
  earlier: 'Earlier',
}

function withinDateFilter(rawDate: string, filter: SessionDateFilter): boolean {
  if (filter === 'all') return true
  const now = new Date()
  const target = new Date(rawDate)
  if (filter === 'today') return target.toDateString() === now.toDateString()
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86_400_000)
  if (filter === 'week') return diffDays >= -7 && diffDays <= 7
  return diffDays >= -30 && diffDays <= 30
}

export function SessionsPage() {
  const navigate = useNavigate()
  const { state, refetch } = useSessionsListData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<SessionStatusFilter>('all')
  const [projectId, setProjectId] = useState('all')
  const [dateFilter, setDateFilter] = useState<SessionDateFilter>('all')
  const [sort, setSort] = useState<SessionSortOption>('recent')

  const hasActiveFilters = search.trim() !== '' || status !== 'all' || projectId !== 'all' || dateFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStatus('all')
    setProjectId('all')
    setDateFilter('all')
  }

  const filteredSorted = useMemo(() => {
    if (state.status !== 'success') return []
    const query = search.trim().toLowerCase()

    const list = state.data.sessions.filter((s) => {
      if (status !== 'all' && s.status !== status) return false
      if (projectId !== 'all' && s.projectId !== projectId) return false
      if (!withinDateFilter(s.rawDate, dateFilter)) return false
      if (query) {
        const haystack = `${s.title} ${s.projectName ?? ''} ${s.participantNames.join(' ')} ${s.summaryPreview}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
        case 'longest':
          return b.durationMinutes - a.durationMinutes
        case 'shortest':
          return a.durationMinutes - b.durationMinutes
        case 'attention':
          return Number(b.needsAttention) - Number(a.needsAttention) || new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
        case 'recent':
        default:
          return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
      }
    })
  }, [state, search, status, projectId, dateFilter, sort])

  // ponytail: grouping only reads cleanly when the list is already date-ordered — other sorts show one flat list.
  const groups = useMemo(() => {
    if (sort !== 'recent') return null
    const map = new Map<SessionDateGroup, SessionListItem[]>()
    for (const session of filteredSorted) {
      const bucket = map.get(session.dateGroup)
      if (bucket) bucket.push(session)
      else map.set(session.dateGroup, [session])
    }
    return map
  }, [filteredSorted, sort])

  const actions = (
    <>
      <Button variant="ghost" leftIcon={<Upload />} onClick={() => navigate('/app/record', { state: { import: true } })}>
        Import recording
      </Button>
      <Button leftIcon={<Mic />} onClick={() => navigate('/app/record')}>
        Record a session
      </Button>
    </>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Sessions" description="Review conversations, decisions, tasks, and everything your team captured." actions={actions} />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="Sessions" description="Review conversations, decisions, tasks, and everything your team captured." actions={actions} />
        <ErrorState title="We couldn't load your sessions" onRetry={refetch} />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="Sessions" description="Review conversations, decisions, tasks, and everything your team captured." actions={actions} />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={<Mic />} title="No sessions yet" description="Record your first meeting to see it appear here." />
        </div>
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer>
      <PageHeader
        title="Sessions"
        description="Review conversations, decisions, tasks, and everything your team captured."
        actions={actions}
        toolbar={
          <SessionsToolbar
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            projectId={projectId}
            onProjectChange={setProjectId}
            projectOptions={data.projectOptions}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            sort={sort}
            onSortChange={setSort}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        }
      />

      {filteredSorted.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title="No sessions match your filters"
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
      ) : groups ? (
        <div className="flex flex-col gap-6">
          {Array.from(groups.entries()).map(([key, sessions]) =>
            key === 'upcoming' ? (
              <Collapsible key={key} defaultOpen={false}>
                <CollapsibleTrigger>
                  <button
                    type="button"
                    className="focus-ring group flex items-center gap-1 rounded px-1 text-caption font-medium uppercase tracking-wide text-subtle-foreground transition-fast hover:text-foreground"
                  >
                    <ChevronRight className="size-3 shrink-0 transition-transform group-aria-expanded:rotate-90" />
                    {GROUP_LABEL[key]}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-1 pt-1">
                  <List>
                    {sessions.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </List>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div key={key} className="flex flex-col gap-1">
                <Caption className="px-1 font-medium uppercase tracking-wide text-subtle-foreground">{GROUP_LABEL[key]}</Caption>
                <List>
                  {sessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </List>
              </div>
            ),
          )}
        </div>
      ) : (
        <List>
          {filteredSorted.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </List>
      )}
    </PageContainer>
  )
}
