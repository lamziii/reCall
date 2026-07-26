import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Caption, Small } from '@/components/typography'
import type { CalendarDay } from '@/data/calendar/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_DOT: Record<string, string> = {
  'needs-review': 'bg-warning',
  processing: 'bg-accent',
  recording: 'bg-danger',
  ready: 'bg-success',
  failed: 'bg-danger',
}

export interface MonthGridProps {
  days: CalendarDay[]
  view: 'month' | 'week'
}

export function MonthGrid({ days, view }: MonthGridProps) {
  const navigate = useNavigate()
  const todayIndex = days.findIndex((d) => d.isToday)
  const currentMonthStart = days.findIndex((d) => d.isCurrentMonth)
  const weekRowStart = Math.floor((todayIndex >= 0 ? todayIndex : Math.max(currentMonthStart, 0)) / 7) * 7
  const rows = view === 'week' ? [days.slice(weekRowStart, weekRowStart + 7)] : chunk(days, 7)

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="flex min-w-[640px] flex-col">
        <div className="grid grid-cols-7 border-b border-border-subtle">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center">
              <Caption className="font-medium uppercase tracking-wide text-subtle-foreground">{day}</Caption>
            </div>
          ))}
        </div>
        <div className="flex flex-col divide-y divide-border-subtle">
          {rows.map((week, i) => (
            <div key={i} className="grid grid-cols-7 divide-x divide-border-subtle">
              {week.map((day) => (
                <div
                  key={day.dateIso}
                  className={cn(
                    'flex flex-col gap-1.5 p-2 transition-fast',
                    view === 'week' ? 'min-h-52' : 'min-h-32',
                    !day.isCurrentMonth && view === 'month' && 'bg-surface/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-medium',
                      day.isToday ? 'bg-accent text-accent-foreground' : day.isCurrentMonth ? 'text-foreground' : 'text-disabled-foreground',
                    )}
                  >
                    {day.dayNumber}
                  </span>
                  <div className="flex flex-col gap-1">
                    {day.sessions.slice(0, view === 'week' ? day.sessions.length : 2).map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        title={`${session.title} · ${session.timeLabel}`}
                        onClick={() => navigate(`/app/sessions/${session.id}`)}
                        className="focus-ring flex items-start gap-1.5 rounded px-1.5 py-1 text-left transition-fast hover:bg-surface-hover"
                      >
                        <span className={cn('mt-1 size-1.5 shrink-0 rounded-full', STATUS_DOT[session.status] ?? 'bg-subtle-foreground')} />
                        <span className="flex min-w-0 flex-col">
                          <Small className="line-clamp-2 text-caption leading-snug text-foreground">{session.title}</Small>
                          <Caption className="text-subtle-foreground">{session.timeLabel}</Caption>
                        </span>
                      </button>
                    ))}
                    {view === 'month' && day.sessions.length > 2 && (
                      <Caption className="px-1.5 text-subtle-foreground">+{day.sessions.length - 2} more</Caption>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size))
}
