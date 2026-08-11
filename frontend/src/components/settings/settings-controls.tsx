import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/forms/switch'
import { Select } from '@/components/forms/select'
import { SegmentedControl } from '@/components/forms/segmented-control'
import type { PreferenceOption } from '@/settings/types'

/** A settings section: heading, optional description, subtle "Reset section" action, divided rows. */
export function SettingsSection({
  title,
  description,
  onReset,
  children,
}: {
  title: string
  description?: string
  onReset?: () => void
  children: ReactNode
}) {
  return (
    <section className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-subtitle font-semibold text-foreground">{title}</h2>
          {description && <p className="text-small text-muted-foreground">{description}</p>}
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="focus-ring flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-caption text-subtle-foreground transition-fast hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset section
          </button>
        )}
      </div>
      <div className="mt-3 divide-y divide-border-subtle">{children}</div>
    </section>
  )
}

/** One preference: label + description on the left, control on the right. Stacks on mobile. `id`
 *  doubles as the search anchor (scroll-into-view + highlight). */
export function SettingRow({
  id,
  label,
  description,
  control,
  children,
  align = 'center',
}: {
  id?: string
  label: ReactNode
  description?: ReactNode
  /** The control, right-aligned. Use `children` instead for full-width content (e.g. previews). */
  control?: ReactNode
  children?: ReactNode
  align?: 'center' | 'start'
}) {
  return (
    <div
      id={id}
      className={cn(
        'flex scroll-mt-24 flex-col gap-3 py-4 transition-fast sm:flex-row sm:justify-between sm:gap-8',
        align === 'center' ? 'sm:items-center' : 'sm:items-start',
        'data-[highlight=true]:rounded-md data-[highlight=true]:bg-surface-selected/60',
      )}
    >
      <div className="flex flex-col gap-0.5 sm:max-w-sm">
        <span className="text-small font-medium text-foreground">{label}</span>
        {description && <span className="text-caption leading-relaxed text-muted-foreground">{description}</span>}
        {children}
      </div>
      {control && <div className="shrink-0 sm:pt-0.5">{control}</div>}
    </div>
  )
}

/** Controlled boolean toggle wrapping the shared Switch. */
export function SettingsToggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label: string
}) {
  return <Switch checked={checked} disabled={disabled} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
}

/** Typed select built from a PreferenceOption[]. */
export function SettingsSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: readonly PreferenceOption<T>[]
  label: string
  className?: string
}) {
  return (
    <Select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      options={options.map((o) => ({ value: o.value, label: o.label }))}
      size="sm"
      className={cn('min-w-40', className)}
    />
  )
}

/** Typed segmented control built from a PreferenceOption[]. */
export function SettingsSegmented<T extends string>({
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
  return (
    <SegmentedControl
      aria-label={label}
      value={value}
      onChange={(v) => onChange(v as T)}
      options={options.map((o) => ({ value: o.value, label: o.label }))}
      size="sm"
    />
  )
}
