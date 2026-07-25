import { cn } from '@/lib/utils'
import { DatePicker } from './date-picker'
import { TimePicker } from './time-picker'

export interface DateTimeFieldProps {
  value?: Date
  onChange?: (date: Date) => void
  className?: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** DatePicker + TimePicker composed into one Date value. */
export function DateTimeField({ value, onChange, className }: DateTimeFieldProps) {
  function handleDateChange(date: Date) {
    const next = new Date(date)
    if (value) next.setHours(value.getHours(), value.getMinutes())
    onChange?.(next)
  }

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const [hours, minutes] = event.target.value.split(':').map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return
    const next = value ? new Date(value) : new Date()
    next.setHours(hours, minutes)
    onChange?.(next)
  }

  const timeValue = value ? `${pad(value.getHours())}:${pad(value.getMinutes())}` : ''

  return (
    <div className={cn('flex gap-2', className)}>
      <DatePicker value={value} onChange={handleDateChange} />
      <TimePicker value={timeValue} onChange={handleTimeChange} className="w-32" />
    </div>
  )
}
