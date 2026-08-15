import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, CalendarClock, CalendarDays, CalendarPlus, CalendarRange, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Surface } from '@/components/layout/surface'
import { Button, IconButton } from '@/components/ui/button'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { SearchInput } from '@/components/forms/search-input'
import { Stat } from '@/components/data-display/stat'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { useCalendarData } from '@/data/calendar/use-calendar-data'
import { MonthGrid } from '@/components/calendar/month-grid'
import { CalendarSidebar } from '@/components/calendar/calendar-sidebar'
import { ScheduleMeetingDialog } from '@/components/calendar/schedule-meeting-dialog'
import { staggerContainer, staggerItem } from '@/styles/animations/presets'

type CalendarView = 'day' | 'week' | 'month'

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const UNIT_LABEL: Record<CalendarView, string> = { day: 'day', week: 'week', month: 'month' }

function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfWeek(date: Date): Date {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  return start
}

export function CalendarPage() {
  const now = new Date()
  const [anchor, setAnchor] = useState(now)
  const [view, setView] = useState<CalendarView>('month')
  const [search, setSearch] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const { state, refetch } = useCalendarData(year, month)
  const reduceMotion = useReducedMotion()

  function goToToday() {
    setAnchor(new Date())
  }

  function shift(delta: number) {
    setAnchor((prev) => {
      if (view === 'day') return addDays(prev, delta)
      if (view === 'week') return addDays(prev, delta * 7)
      return new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    })
  }

  const filteredDays = useMemo(() => {
    if (state.status !== 'success') return []
    const query = search.trim().toLowerCase()
    if (!query) return state.data.days
    return state.data.days.map((day) => ({ ...day, sessions: day.sessions.filter((s) => s.title.toLowerCase().includes(query)) }))
  }, [state, search])

  const monthSessionCount = useMemo(() => {
    if (state.status !== 'success') return 0
    return state.data.days.filter((d) => d.isCurrentMonth).reduce((sum, d) => sum + d.sessions.length, 0)
  }, [state])

  const periodLabel = useMemo(() => {
    if (view === 'day') return anchor.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    if (view === 'week') {
      const start = startOfWeek(anchor)
      const end = addDays(start, 6)
      const sameMonth = start.getMonth() === end.getMonth()
      const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const endLabel = end.toLocaleDateString(undefined, sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
      return `${startLabel} – ${endLabel}`
    }
    return state.status === 'success' ? state.data.monthLabel : anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [view, anchor, state])

  const transitionKey = useMemo(() => {
    if (view === 'day') return `day-${anchor.toDateString()}`
    if (view === 'week') return `week-${startOfWeek(anchor).toDateString()}`
    return `month-${year}-${month}`
  }, [view, anchor, year, month])

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
        <IconButton icon={<ChevronLeft />} label={`Previous ${UNIT_LABEL[view]}`} variant="ghost" size="sm" onClick={() => shift(-1)} />
        <span className="min-w-32 text-center text-small font-medium text-foreground">{periodLabel}</span>
        <IconButton icon={<ChevronRight />} label={`Next ${UNIT_LABEL[view]}`} variant="ghost" size="sm" onClick={() => shift(1)} />
      </div>
      <Button variant="secondary" size="sm" onClick={goToToday}>
        Today
      </Button>
      <SegmentedControl aria-label="Calendar view" value={view} onChange={(v) => setView(v as CalendarView)} options={VIEW_OPTIONS} size="sm" />
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
        placeholder="Search sessions..."
        className="w-full sm:ml-auto sm:w-56"
      />
      <Button size="sm" leftIcon={<CalendarPlus />} onClick={() => setScheduleOpen(true)}>
        Schedule meeting
      </Button>
    </div>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Calendar" description="Every meeting, past and upcoming." />
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,76fr)_minmax(0,24fr)]">
          <Skeleton className="h-[32rem] w-full rounded-xl" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
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
          <EmptyState
            icon={<CalendarDays />}
            title="Nothing scheduled"
            description="Sessions you record or schedule will show up here."
            action={
              <Button size="sm" leftIcon={<CalendarPlus />} onClick={() => setScheduleOpen(true)}>
                Schedule meeting
              </Button>
            }
          />
        </div>
        <ScheduleMeetingDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
      </PageContainer>
    )
  }

  const containerVariants = reduceMotion ? undefined : staggerContainer
  const itemVariants = reduceMotion ? undefined : staggerItem

  return (
    <PageContainer>
      <PageHeader title="Calendar" description="Every meeting, past and upcoming." toolbar={toolbar} />

      <motion.div className="flex flex-col gap-6" variants={containerVariants} initial="initial" animate="animate">
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Surface level="raised" border padding="md" className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent [&>svg]:size-4">
              <CalendarRange />
            </span>
            <Stat label="This month" value={monthSessionCount} />
          </Surface>
          <Surface level="raised" border padding="md" className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-active text-subtle-foreground [&>svg]:size-4">
              <Clock />
            </span>
            <Stat label="Today" value={state.data.todaysAgenda.length} />
          </Surface>
          <Surface level="raised" border padding="md" className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-active text-subtle-foreground [&>svg]:size-4">
              <CalendarClock />
            </span>
            <Stat label="Upcoming" value={state.data.upcomingMeetings.length} />
          </Surface>
          <Surface level="raised" border padding="md" className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-muted text-warning [&>svg]:size-4">
              <AlertCircle />
            </span>
            <Stat label="Deadlines" value={state.data.upcomingDeadlines.length} />
          </Surface>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,76fr)_minmax(0,24fr)]">
          <MonthGrid days={filteredDays} view={view} anchorIso={anchor.toISOString()} transitionKey={transitionKey} />
          <CalendarSidebar
            upcomingMeetings={state.data.upcomingMeetings}
            todaysAgenda={state.data.todaysAgenda}
            upcomingDeadlines={state.data.upcomingDeadlines}
            recentSessions={state.data.recentSessions}
          />
        </motion.div>
      </motion.div>

      <ScheduleMeetingDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </PageContainer>
  )
}
