import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/forms/input'
import { Calendar, type DateRange } from './calendar'

export interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  placeholder?: string
}

function format(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function DateRangePicker({ value, onChange, placeholder = 'Select date range' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const label = value?.start && value.end ? `${format(value.start)} – ${format(value.end)}` : value?.start ? format(value.start) : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <button type="button" className="block w-64 text-left">
          <Input
            readOnly
            tabIndex={-1}
            value={label}
            placeholder={placeholder}
            rightIcon={<CalendarDays />}
            className="pointer-events-none"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent placement="bottom-start" className="p-3">
        <Calendar
          mode="range"
          rangeValue={value}
          onRangeChange={(range) => {
            onChange?.(range)
            if (range.start && range.end) setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
