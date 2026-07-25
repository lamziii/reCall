import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DateRange {
  start?: Date
  end?: Date
}

export interface CalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  mode?: 'single' | 'range'
  rangeValue?: DateRange
  onRangeChange?: (range: DateRange) => void
  minDate?: Date
  maxDate?: Date
  isDateDisabled?: (date: Date) => boolean
  className?: string
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBetween(day: Date, start: Date, end: Date) {
  const t = day.getTime()
  return t > Math.min(start.getTime(), end.getTime()) && t < Math.max(start.getTime(), end.getTime())
}

function buildGrid(month: Date) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const startOffset = firstDay.getDay()

  const days: (Date | null)[] = Array.from({ length: startOffset }, () => null)
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, monthIndex, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

/** Single-month grid. Supports single-date or range selection, min/max bounds, and per-day disabling. Arrow keys move focus by day. */
export function Calendar({
  value,
  onChange,
  mode = 'single',
  rangeValue,
  onRangeChange,
  minDate,
  maxDate,
  isDateDisabled,
  className,
}: CalendarProps) {
  const [month, setMonth] = useState(() => value ?? rangeValue?.start ?? new Date())
  const today = new Date()
  const days = buildGrid(month)
  const focusableDay = value && value.getMonth() === month.getMonth() ? value : days.find((d) => d)

  function isDisabled(day: Date) {
    if (minDate && day < minDate) return true
    if (maxDate && day > maxDate) return true
    return isDateDisabled?.(day) ?? false
  }

  function selectDay(day: Date) {
    if (isDisabled(day)) return
    if (mode === 'range') {
      const { start, end } = rangeValue ?? {}
      if (!start || (start && end)) {
        onRangeChange?.({ start: day, end: undefined })
      } else if (day < start) {
        onRangeChange?.({ start: day, end: start })
      } else {
        onRangeChange?.({ start, end: day })
      }
      return
    }
    onChange?.(day)
  }

  function onKeyDown(event: React.KeyboardEvent, day: Date) {
    const deltas: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }
    const delta = deltas[event.key]
    if (delta === undefined) return
    event.preventDefault()
    const next = new Date(day)
    next.setDate(day.getDate() + delta)
    if (next.getMonth() !== month.getMonth()) setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    requestAnimationFrame(() => {
      document.getElementById(`cal-day-${next.toISOString().slice(0, 10)}`)?.focus()
    })
  }

  return (
    <div className={cn('w-72 select-none', className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-small font-medium text-foreground">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            label="Previous month"
            icon={<ChevronLeft />}
            className="size-7"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          />
          <IconButton
            size="sm"
            variant="ghost"
            label="Next month"
            icon={<ChevronRight />}
            className="size-7"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day, i) => (
          <span key={i} className="text-caption text-subtle-foreground">
            {day}
          </span>
        ))}
        {days.map((day, i) => {
          if (!day) return <span key={i} />
          const disabled = isDisabled(day)
          const isToday = isSameDay(day, today)

          const rangeStart = mode === 'range' && rangeValue?.start && isSameDay(day, rangeValue.start)
          const rangeEnd = mode === 'range' && rangeValue?.end && isSameDay(day, rangeValue.end)
          const inRange = mode === 'range' && rangeValue?.start && rangeValue?.end && isBetween(day, rangeValue.start, rangeValue.end)
          const selected = mode === 'single' ? value && isSameDay(day, value) : rangeStart || rangeEnd

          const isFocusable = mode === 'single' && focusableDay ? isSameDay(day, focusableDay) : isToday

          return (
            <span key={i} className={cn('relative', inRange && 'bg-surface-active')}>
              <button
                id={`cal-day-${day.toISOString().slice(0, 10)}`}
                type="button"
                disabled={disabled}
                tabIndex={isFocusable ? 0 : -1}
                aria-current={isToday ? 'date' : undefined}
                aria-selected={Boolean(selected)}
                onClick={() => selectDay(day)}
                onKeyDown={(e) => onKeyDown(e, day)}
                className={cn(
                  'focus-ring relative mx-auto flex size-8 items-center justify-center rounded-full text-small transition-fast',
                  'text-foreground hover:bg-surface-hover',
                  isToday && !selected && 'text-accent',
                  selected && 'bg-accent text-accent-foreground hover:bg-accent',
                  disabled && 'pointer-events-none text-disabled-foreground',
                )}
              >
                {day.getDate()}
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}
