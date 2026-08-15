import { forwardRef } from 'react'
import { Clock } from 'lucide-react'
import { Input, type InputProps } from '@/components/forms/input'

export type TimePickerProps = Omit<InputProps, 'type' | 'leftIcon'>

/** Native <input type="time"> — platform-correct keyboard entry and locale formatting for free. */
export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>((props, ref) => {
  return <Input ref={ref} type="time" leftIcon={<Clock />} {...props} />
})
TimePicker.displayName = 'TimePicker'
