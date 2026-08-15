import { forwardRef, useState } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn, mergeRefs } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  autoResize?: boolean
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 4, autoResize, showCount, maxLength, onChange, defaultValue, value, ...props }, ref) => {
    const [count, setCount] = useState(String(value ?? defaultValue ?? '').length)

    function resize(el: HTMLTextAreaElement) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }

    return (
      <div className="relative">
        <textarea
          ref={mergeRefs(ref, (el: HTMLTextAreaElement | null) => {
            if (el && autoResize) resize(el)
          })}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error}
          onChange={(event) => {
            if (autoResize) resize(event.currentTarget)
            setCount(event.currentTarget.value.length)
            onChange?.(event)
          }}
          className={cn(
            'w-full rounded-md border bg-surface px-3 py-2 text-small text-foreground placeholder:text-subtle-foreground',
            'transition-fast outline-none disabled:cursor-not-allowed disabled:opacity-40',
            autoResize ? 'resize-none overflow-hidden' : 'resize-y',
            showCount && maxLength && 'pb-6',
            error
              ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/30'
              : 'border-border focus:border-border-accent focus:ring-2 focus:ring-focus-ring/40',
            className,
          )}
          {...props}
        />
        {showCount && maxLength && (
          <span className="pointer-events-none absolute bottom-2 right-3 text-caption tabular-nums text-subtle-foreground">
            {count}/{maxLength}
          </span>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
