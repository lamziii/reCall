import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PreferenceOption } from '@/settings/types'

/** Roving-focus radiogroup shared by the swatch + preview selectors below. */
function useRoving<T extends string>(options: readonly { value: T; disabled?: boolean }[], value: T, onChange: (v: T) => void) {
  return (event: React.KeyboardEvent) => {
    const enabled = options.filter((o) => !o.disabled)
    const index = enabled.findIndex((o) => o.value === value)
    if (index === -1) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      onChange(enabled[(index + 1) % enabled.length].value)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      onChange(enabled[(index - 1 + enabled.length) % enabled.length].value)
    }
  }
}

const ACCENT_SWATCH: Record<string, string> = {
  blue: 'oklch(60% 0.15 258)',
  purple: 'oklch(60% 0.17 300)',
  emerald: 'oklch(63% 0.14 158)',
  orange: 'oklch(68% 0.16 55)',
  rose: 'oklch(62% 0.19 15)',
  slate: 'oklch(60% 0.03 260)',
}

/** Accent swatches. Color is decorative — each has a visible text label so it never relies on hue alone. */
export function SettingsColorSelector<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: readonly PreferenceOption<T>[]
  label: string
}) {
  const onKeyDown = useRoving(options, value, onChange)
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'focus-ring flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-caption transition-fast',
              active ? 'border-border-strong bg-surface-active text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <span
              className="size-3.5 rounded-full ring-1 ring-inset ring-black/20"
              style={{ backgroundColor: ACCENT_SWATCH[option.value] ?? 'var(--color-accent)' }}
              aria-hidden
            />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export interface PreviewOption<T extends string> extends PreferenceOption<T> {
  preview: ReactNode
}

/** Compact card selector with a small schematic preview per option (theme, sidebar style, radius, …). */
export function SettingsPreviewSelector<T extends string>({
  value,
  onChange,
  options,
  label,
  columns = 4,
}: {
  value: T
  onChange: (value: T) => void
  options: readonly PreviewOption<T>[]
  label: string
  columns?: 2 | 3 | 4
}) {
  const onKeyDown = useRoving(options, value, onChange)
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('grid gap-2', columns === 2 && 'grid-cols-2', columns === 3 && 'grid-cols-3', columns === 4 && 'grid-cols-2 sm:grid-cols-4')}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'focus-ring group relative flex flex-col gap-2 rounded-lg border p-2 text-left transition-fast',
              active ? 'border-border-accent bg-surface-active' : 'border-border hover:border-border-strong',
            )}
          >
            <span className="flex h-14 items-center justify-center overflow-hidden rounded-md bg-bg">{option.preview}</span>
            <span className="flex items-center justify-between gap-1 px-0.5">
              <span className={cn('text-caption font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>{option.label}</span>
              {active && <Check className="size-3.5 text-accent" aria-hidden />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
