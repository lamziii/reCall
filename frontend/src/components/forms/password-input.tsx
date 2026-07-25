import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, type InputProps } from './input'
import { cn } from '@/lib/utils'

export type PasswordInputProps = Omit<InputProps, 'type' | 'rightIcon'>

/** Password field with a show/hide toggle and a Caps Lock warning. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ className, onKeyUp, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        onKeyUp={(event) => {
          setCapsLock(event.getModifierState('CapsLock'))
          onKeyUp?.(event)
        }}
        rightIcon={
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="pointer-events-auto"
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        }
        {...props}
      />
      {capsLock && (
        <p role="status" className="text-caption text-warning">
          Caps Lock is on
        </p>
      )}
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'
