import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button, IconButton } from '@/components/ui/button'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { SearchInput } from '@/components/forms/search-input'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { useCalendarData } from '@/data/calendar/use-calendar-data'
import { MonthGrid } from '@/components/calendar/month-grid'
import { CalendarSidebar } from '@/components/calendar/calendar-sidebar'

const VIEW_OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

export function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState<'week' | 'month'>('month')
  const [search, setSearch] = useState('')
  const { state, refetch } = useCalendarData(year, month)

  function goToToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const filteredDays = useMemo(() => {
    if (state.status !== 'success') return []
    const query = search.trim().toLowerCase()
    if (!query) return state.data.days
    return state.data.days.map((day) => ({ ...day, sessions: day.sessions.filter((s) => s.title.toLowerCase().includes(query)) }))
  }, [state, search])

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <IconButton icon={<ChevronLeft />} label="Previous month" variant="ghost" size="sm" onClick={() => shiftMonth(-1)} />
        <span className="min-w-36 text-center text-small font-medium text-foreground">
          {state.status === 'success' ? state.data.monthLabel : ' '}
        </span>
        <IconButton icon={<ChevronRight />} label="Next month" variant="ghost" size="sm" onClick={() => shiftMonth(1)} />
      </div>
      <Button variant="secondary" size="sm" onClick={goToToday}>
        Today
      </Button>
      <SegmentedControl aria-label="Calendar view" value={view} onChange={(v) => setView(v as 'week' | 'month')} options={VIEW_OPTIONS} size="sm" />
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search sessions..."
        className="w-full sm:ml-auto sm:w-56"
      />
    </div>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Calendar" description="Every meeting, past and upcoming." />
        <Skeleton className="h-96 w-full" />
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="Calendar" description="Every meeting, past and upcoming." />
        <ErrorState title="We couldn't load your calendar" onRetry={refetch} />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="Calendar" description="Every meeting, past and upcoming." />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={<CalendarIcon />} title="Nothing scheduled" description="Sessions you record or schedule will show up here." />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Calendar" description="Every meeting, past and upcoming." toolbar={toolbar} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_1fr] xl:grid-cols-[76fr_24fr]">
        <MonthGrid days={filteredDays} view={view} />
        <CalendarSidebar
          upcomingMeetings={state.data.upcomingMeetings}
          todaysAgenda={state.data.todaysAgenda}
          upcomingDeadlines={state.data.upcomingDeadlines}
          recentSessions={state.data.recentSessions}
        />
      </div>
    </PageContainer>
  )
}
