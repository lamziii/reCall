import { useState } from 'react'
import { Calendar } from '@/components/data-display/calendar'
import { DatePicker } from '@/components/data-display/date-picker'
import { TimePicker } from '@/components/data-display/time-picker'
import { DateTimeField } from '@/components/data-display/date-time-field'
import { DateRangePicker } from '@/components/data-display/date-range-picker'
import type { DateRange } from '@/components/data-display/calendar'
import { PlaygroundSection, PlaygroundRow } from '../playground-section'

export function DateTimeSection() {
  const [date, setDate] = useState<Date>()
  const [dateTime, setDateTime] = useState<Date>()
  const [range, setRange] = useState<DateRange>({})

  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 30)

  return (
    <PlaygroundSection
      id="date-time"
      title="Date and time"
      description="Calendar is the shared engine — DatePicker, DateRangePicker, and DateTimeField all compose it. Not enterprise scheduling, just the small pieces a session/task needs."
    >
      <PlaygroundRow label="Calendar">
        <Calendar value={date} onChange={setDate} />
      </PlaygroundRow>

      <PlaygroundRow label="Calendar — min/max + disabled dates">
        <Calendar
          value={date}
          onChange={setDate}
          minDate={today}
          maxDate={maxDate}
          isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6}
        />
      </PlaygroundRow>

      <PlaygroundRow label="DatePicker">
        <DatePicker value={date} onChange={setDate} />
      </PlaygroundRow>

      <PlaygroundRow label="TimePicker">
        <TimePicker className="w-40" />
      </PlaygroundRow>

      <PlaygroundRow label="DateTimeField">
        <DateTimeField value={dateTime} onChange={setDateTime} />
      </PlaygroundRow>

      <PlaygroundRow label="DateRangePicker">
        <DateRangePicker value={range} onChange={setRange} />
      </PlaygroundRow>
    </PlaygroundSection>
  )
}
