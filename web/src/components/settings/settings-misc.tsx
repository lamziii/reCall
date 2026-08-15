import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Switch } from '@/components/forms/switch'

/** A destructive/technical action: label + description with a right-aligned button that confirms first.
 *  Danger styling is reserved (not a wall of red buttons). */
export function SettingsDangerAction({
  id,
  label,
  description,
  buttonLabel,
  buttonIcon,
  variant = 'secondary',
  requireConfirm = true,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  loading,
  onConfirm,
}: {
  id?: string
  label: string
  description?: string
  buttonLabel: string
  buttonIcon?: ReactNode
  variant?: 'secondary' | 'ghost' | 'danger'
  requireConfirm?: boolean
  confirmTitle?: string
  confirmDescription?: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div id={id} className="flex scroll-mt-24 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex flex-col gap-0.5 sm:max-w-sm">
        <span className="text-small font-medium text-foreground">{label}</span>
        {description && <span className="text-caption leading-relaxed text-muted-foreground">{description}</span>}
      </div>
      <Button
        variant={variant}
        size="sm"
        leftIcon={buttonIcon}
        loading={loading}
        className="w-fit shrink-0"
        onClick={() => (requireConfirm ? setOpen(true) : onConfirm())}
      >
        {buttonLabel}
      </Button>
      {requireConfirm && (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={confirmTitle ?? label}
          description={confirmDescription ?? ''}
          confirmLabel={confirmLabel ?? buttonLabel}
          cancelLabel="Cancel"
          variant={variant === 'danger' ? 'danger' : 'default'}
          onConfirm={onConfirm}
        />
      )}
    </div>
  )
}

/** A single experimental feature: name, description, Beta badge, toggle. Reusable so new flags are trivial. */
export function ExperimentalFeatureRow({
  id,
  name,
  description,
  enabled,
  onChange,
}: {
  id: string
  name: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div id={id} className="flex items-start justify-between gap-6 py-4">
      <div className="flex flex-col gap-0.5 sm:max-w-md">
        <span className="flex items-center gap-2">
          <span className="text-small font-medium text-foreground">{name}</span>
          <span className="rounded border border-border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-subtle-foreground">Beta</span>
        </span>
        <span className="text-caption leading-relaxed text-muted-foreground">{description}</span>
      </div>
      <Switch checked={enabled} aria-label={name} onChange={(e) => onChange(e.target.checked)} />
    </div>
  )
}
