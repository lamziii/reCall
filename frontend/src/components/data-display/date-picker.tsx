import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/forms/input'
import { Calendar } from './calendar'

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <button type="button" className="block w-56 text-left">
          <Input
            readOnly
            tabIndex={-1}
            value={value ? value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
            placeholder={placeholder}
            rightIcon={<CalendarDays />}
            className="pointer-events-none"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent placement="bottom-start" className="p-3">
        <Calendar
          value={value}
          onChange={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
