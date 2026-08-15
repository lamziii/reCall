import { useNavigate } from '@/lib/router-compat'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Caption, Small } from '@/components/typography'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DURATION, EASE_STANDARD } from '@/styles/animations/presets'
import type { CalendarDay } from '@/data/calendar/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_STYLE: Record<string, { dot: string; border: string }> = {
  'needs-review': { dot: 'bg-warning', border: 'border-l-warning' },
  processing: { dot: 'bg-accent', border: 'border-l-accent' },
  recording: { dot: 'bg-danger', border: 'border-l-danger' },
  paused: { dot: 'bg-warning', border: 'border-l-warning' },
  ready: { dot: 'bg-success', border: 'border-l-success' },
  failed: { dot: 'bg-danger', border: 'border-l-danger' },
  scheduled: { dot: 'bg-subtle-foreground', border: 'border-l-border-strong' },
  archived: { dot: 'bg-subtle-foreground', border: 'border-l-border-strong' },
}
const DEFAULT_STATUS_STYLE = { dot: 'bg-subtle-foreground', border: 'border-l-border-strong' }

function isSameCalendarDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA)
  const b = new Date(isoB)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export interface MonthGridProps {
  days: CalendarDay[]
  view: 'month' | 'week' | 'day'
  /** The day currently focused — anchors which week row (week view) or single day (day view) is shown. */
  anchorIso: string
  /** Changing this key drives the cross-fade when the visible period changes. */
  transitionKey: string
}

export function MonthGrid({ days, view, anchorIso, transitionKey }: MonthGridProps) {
  const navigate = useNavigate()

  if (view === 'day') {
    const day = days.find((d) => isSameCalendarDay(d.dateIso, anchorIso))
    return <DayAgenda day={day} transitionKey={transitionKey} />
  }

  const anchorIndex = days.findIndex((d) => isSameCalendarDay(d.dateIso, anchorIso))
  const weekRowStart = Math.floor(Math.max(anchorIndex, 0) / 7) * 7
  const rows = view === 'week' ? [days.slice(weekRowStart, weekRowStart + 7)] : chunk(days, 7)
  const maxVisible = view === 'week' ? Infinity : 2

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
      <div className="overflow-x-auto">
        <div className="flex min-w-[720px] flex-col">
          <div className="grid grid-cols-7 border-b border-border-subtle bg-surface">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2.5 text-center">
                <Caption className="font-semibold uppercase tracking-wide text-subtle-foreground">{day}</Caption>
              </div>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={transitionKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
              className="flex flex-col divide-y divide-border-subtle"
            >
              {rows.map((week, i) => (
                <div key={i} className="grid grid-cols-7 divide-x divide-border-subtle">
                  {week.map((day) => {
                    const visibleSessions = day.sessions.slice(0, maxVisible)
                    const overflowCount = day.sessions.length - visibleSessions.length
                    const dayLabel = new Date(day.dateIso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

                    return (
                      <div
                        key={day.dateIso}
                        className={cn(
                          'group relative flex flex-col gap-1.5 p-2 transition-fast hover:bg-surface-hover/50',
                          view === 'week' ? 'min-h-56' : 'min-h-32',
                          !day.isCurrentMonth && view === 'month' && 'bg-surface/60',
                          day.isToday && 'bg-accent-muted',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-medium',
                            day.isToday ? 'bg-accent text-accent-foreground shadow-xs' : day.isCurrentMonth ? 'text-foreground' : 'text-disabled-foreground',
                          )}
                        >
                          {day.dayNumber}
                        </span>
                        <div className="flex flex-col gap-1">
                          {visibleSessions.map((session) => {
                            const style = STATUS_STYLE[session.status] ?? DEFAULT_STATUS_STYLE
                            return (
                              <button
                                key={session.id}
                                type="button"
                                title={`${session.title} · ${session.timeLabel}`}
                                onClick={() => navigate(`/app/sessions/${session.id}`)}
                                className={cn(
                                  'focus-ring flex items-start gap-1.5 rounded-md border-l-2 bg-surface-active/40 px-1.5 py-1 text-left transition-fast hover:bg-surface-hover hover:shadow-xs',
                                  style.border,
                                )}
                              >
                                <span className="flex min-w-0 flex-col">
                                  <Small className="line-clamp-2 text-caption leading-snug text-foreground">{session.title}</Small>
                                  <Caption className="text-subtle-foreground">{session.timeLabel}</Caption>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                        {overflowCount > 0 && (
                          <Popover>
                            <PopoverTrigger>
                              <button
                                type="button"
                                className="focus-ring w-fit rounded px-1.5 text-left text-caption font-medium text-subtle-foreground transition-fast hover:text-accent"
                              >
                                +{overflowCount} more
                              </button>
                            </PopoverTrigger>
                            <PopoverContent width={240} className="p-2">
                              <Caption className="block px-1.5 pb-1.5 pt-0.5 font-medium text-subtle-foreground">{dayLabel}</Caption>
                              <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                                {day.sessions.map((session) => {
                                  const style = STATUS_STYLE[session.status] ?? DEFAULT_STATUS_STYLE
                                  return (
                                    <button
                                      key={session.id}
                                      type="button"
                                      onClick={() => navigate(`/app/sessions/${session.id}`)}
                                      className="focus-ring flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-fast hover:bg-surface-hover"
                                    >
                                      <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} />
                                      <span className="flex min-w-0 flex-col">
                                        <Small className="truncate text-caption text-foreground">{session.title}</Small>
                                        <Caption className="text-subtle-foreground">{session.timeLabel}</Caption>
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function DayAgenda({ day, transitionKey }: { day: CalendarDay | undefined; transitionKey: string }) {
  const navigate = useNavigate()
  if (!day) return null

  const dateLabel = new Date(day.dateIso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface-raised">
      <div className="flex items-center gap-2.5 border-b border-border-subtle bg-surface px-4 py-3">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-small font-semibold',
            day.isToday ? 'bg-accent text-accent-foreground' : 'bg-surface-active text-foreground',
          )}
        >
          {day.dayNumber}
        </span>
        <Small className="font-medium text-foreground">{dateLabel}</Small>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
          className="flex flex-1 flex-col divide-y divide-border-subtle"
        >
          {day.sessions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-16">
              <Caption className="text-subtle-foreground">Nothing scheduled for this day.</Caption>
            </div>
          ) : (
            day.sessions.map((session) => {
              const style = STATUS_STYLE[session.status] ?? DEFAULT_STATUS_STYLE
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => navigate(`/app/sessions/${session.id}`)}
                  className={cn(
                    'focus-ring flex items-center gap-3 border-l-2 px-4 py-3 text-left transition-fast hover:bg-surface-hover',
                    style.border,
                  )}
                >
                  <Caption className="w-16 shrink-0 tabular-nums text-muted-foreground">{session.timeLabel}</Caption>
                  <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} />
                  <Small className="min-w-0 flex-1 truncate font-medium text-foreground">{session.title}</Small>
                </button>
              )
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size))
}
