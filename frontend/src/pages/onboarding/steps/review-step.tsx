import { Pencil } from 'lucide-react'
import { Body, Caption, Label, Small } from '@/components/typography'
import { Button } from '@/components/ui/button'
import {
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  USE_CASE_OPTIONS,
  WORKSPACE_TYPE_OPTIONS,
  languageLabel,
} from '../options'
import { countryName } from '../countries'
import { formatDateExample } from '../regional'
import type { OnboardingForm, StepId } from '../types'

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value
}

interface Props {
  form: OnboardingForm
  onEdit: (step: StepId) => void
}

/** Step 7 — a concise, editable summary. Each section links back to its step. */
export function ReviewStep({ form, onEdit }: Props) {
  const useCaseLabels = form.useCases
    .map((v) => (v === 'other' ? form.customUseCase.trim() || 'Other' : labelOf(USE_CASE_OPTIONS, v)))
    .filter(Boolean)

  const industryLabel = form.industry === 'other' ? form.customIndustry.trim() || 'Other' : form.industry ? labelOf(INDUSTRY_OPTIONS, form.industry) : '—'

  return (
    <div className="flex flex-col gap-3">
      <Section title="Account" step="account" onEdit={onEdit}>
        <Row label="Name" value={form.fullName || '—'} />
        <Row label="Email" value={form.email || '—'} />
        <Row label="Sign-in" value={form.authProvider === 'google' ? 'Google' : 'Email & password'} />
        <Row label="Two-factor" value={twoFactorLabel(form.twoFactorStatus)} />
      </Section>

      <Section title="Use cases" step="use-cases" onEdit={onEdit}>
        <Small className="text-foreground">{useCaseLabels.length ? useCaseLabels.join(', ') : '—'}</Small>
      </Section>

      <Section title="Workspace" step="workspace" onEdit={onEdit}>
        <Row label="Name" value={form.workspaceName || '—'} />
        <Row label="Type" value={form.workspaceType ? labelOf(WORKSPACE_TYPE_OPTIONS, form.workspaceType) : '—'} />
        <Row label="Team size" value={form.teamSize ? labelOf(TEAM_SIZE_OPTIONS, form.teamSize) : '—'} />
        <Row label="Industry" value={industryLabel} />
      </Section>

      <Section title="Preferences" step="regional" onEdit={onEdit}>
        <Row label="Language" value={languageLabel(form.language)} />
        <Row label="Time zone" value={form.timezone || '—'} />
        <Row label="Country" value={form.country ? countryName(form.country) : '—'} />
        <Row label="Date format" value={`${form.dateFormat} (${formatDateExample(form.dateFormat)})`} />
        <Row label="Time format" value={form.timeFormat === '12h' ? '12-hour' : '24-hour'} />
      </Section>

      <Section title="Invites" step="invite" onEdit={onEdit}>
        {form.invites.length ? (
          <Small className="text-foreground">{form.invites.map((i) => `${i.email} (${i.role})`).join(', ')}</Small>
        ) : (
          <Small className="text-subtle-foreground">None — you can invite people later.</Small>
        )}
      </Section>
    </div>
  )
}

function twoFactorLabel(status: OnboardingForm['twoFactorStatus']): string {
  switch (status) {
    case 'enabled':
      return 'Enabled'
    case 'unavailable':
      return 'Pending setup'
    case 'skipped':
      return 'Skipped'
    default:
      return 'Not configured'
  }
}

function Section({ title, step, onEdit, children }: { title: string; step: StepId; onEdit: (s: StepId) => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <Label as="span">{title}</Label>
        <Button variant="text" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => onEdit(step)}>
          Edit
        </Button>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <Caption className="text-subtle-foreground">{label}</Caption>
      <Body className="min-w-0 truncate text-right text-small text-foreground">{value}</Body>
    </div>
  )
}
