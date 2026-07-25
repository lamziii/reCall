import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldRenderProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

export interface FormFieldProps {
  label?: ReactNode
  description?: ReactNode
  helperText?: ReactNode
  error?: string
  success?: string
  required?: boolean
  optional?: boolean
  characterCount?: { current: number; max: number }
  className?: string
  /** Override the label's default weight/color — e.g. a lighter, quieter label in premium/calm contexts. */
  labelClassName?: string
  children: (field: FormFieldRenderProps) => ReactNode
}

/**
 * Wraps any form control with a consistent label/description/error/success/count
 * layout and correct aria wiring. Pass the generated field props straight
 * through to the control: `<FormField label="Email">{(f) => <Input {...f} />}</FormField>`
 */
export function FormField({
  label,
  description,
  helperText,
  error,
  success,
  required,
  optional,
  characterCount,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const messageId = `${id}-message`
  const countId = `${id}-count`

  const describedBy = [description && descriptionId, (error || success || helperText) && messageId, characterCount && countId]
    .filter(Boolean)
    .join(' ')

  const message = error ?? success ?? helperText
  const messageTone = error ? 'text-danger' : success ? 'text-success' : 'text-muted-foreground'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || optional) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={id} className={cn('text-label font-medium text-foreground', labelClassName)}>
              {label}
              {required && (
                <span aria-hidden className="ml-0.5 text-danger">
                  *
                </span>
              )}
            </label>
          )}
          {optional && <span className="text-caption text-subtle-foreground">Optional</span>}
        </div>
      )}

      {description && (
        <p id={descriptionId} className="text-small text-muted-foreground">
          {description}
        </p>
      )}

      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })}

      {(message || characterCount) && (
        <div className="flex items-center justify-between gap-2">
          {message ? (
            <p id={messageId} role={error ? 'alert' : undefined} className={cn('text-small', messageTone)}>
              {message}
            </p>
          ) : (
            <span />
          )}
          {characterCount && (
            <span id={countId} className="shrink-0 text-caption tabular-nums text-subtle-foreground">
              {characterCount.current}/{characterCount.max}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
