import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { Combobox, FormField, Select, SegmentedControl } from '@/components/forms'
import { Body, Caption, Small } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { DATE_FORMAT_OPTIONS, LANGUAGE_OPTIONS, TIME_FORMAT_OPTIONS } from '../options'
import { COUNTRY_OPTIONS } from '../countries'
import { detectTimezone, formatDateExample, formatTimeExample } from '../regional'
import type { OnboardingForm } from '../types'

const FIELD_SIZE = 'h-14 rounded-xl border-border-subtle bg-surface-raised text-body focus:border-accent/50 focus:ring-[3px] focus:ring-accent/15'
const LABEL_STYLE = 'font-normal text-muted-foreground'

/** All IANA time zones for the manual override, when the platform exposes them. */
function allTimezones(): string[] {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
    return supported ? supported('timeZone') : []
  } catch {
    return []
  }
}

interface Props {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
}

/** Step 5 — language & regional. Four supported languages (native labels), auto-detected time zone
 *  (override only if needed), a searchable full country list, and date/time formats with examples. */
export function RegionalStep({ form, update }: Props) {
  const [editingTz, setEditingTz] = useState(false)
  const now = useMemo(() => new Date(), [])
  const tzOptions = useMemo(() => allTimezones().map((tz) => ({ value: tz, label: tz })), [])

  const dateOptions = DATE_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: `${o.label}  ·  ${formatDateExample(o.value, now)}` }))
  const timeOptions = TIME_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: `${o.label}  ·  ${formatTimeExample(o.value, now)}` }))

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Preferred language" labelClassName={LABEL_STYLE} required>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            options={LANGUAGE_OPTIONS}
            value={form.language}
            onChange={(e) => update({ language: e.target.value })}
          />
        )}
      </FormField>

      {/* Time zone — auto-detected, override only if wrong or detection failed. */}
      <div className="flex flex-col gap-2">
        <span className={`text-label ${LABEL_STYLE}`}>Time zone</span>
        {form.timezone && !editingTz ? (
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            <Body className="text-foreground">{form.timezone}</Body>
            <Caption className="text-subtle-foreground">detected</Caption>
            <Button variant="text" size="sm" className="ml-auto" onClick={() => setEditingTz(true)}>
              Change
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tzOptions.length > 0 ? (
              <Combobox
                options={tzOptions}
                value={form.timezone}
                onChange={(value) => {
                  update({ timezone: value })
                  setEditingTz(false)
                }}
                placeholder="Search time zones…"
                className={FIELD_SIZE}
              />
            ) : (
              <Caption className="text-subtle-foreground">We couldn't detect your time zone. It will default to UTC.</Caption>
            )}
            {!form.timezone && (
              <Button
                variant="text"
                size="sm"
                className="w-fit"
                onClick={() => update({ timezone: detectTimezone() ?? 'UTC' })}
              >
                Detect again
              </Button>
            )}
          </div>
        )}
      </div>

      <FormField label="Country or region" optional labelClassName={LABEL_STYLE}>
        {() => (
          <Combobox
            options={COUNTRY_OPTIONS}
            value={form.country}
            onChange={(value) => update({ country: value })}
            placeholder="Search countries…"
            className={FIELD_SIZE}
          />
        )}
      </FormField>

      <FormField label="Date format" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select {...field} className={FIELD_SIZE} options={dateOptions} value={form.dateFormat} onChange={(e) => update({ dateFormat: e.target.value })} />
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <span className={`text-label ${LABEL_STYLE}`}>Time format</span>
        <SegmentedControl
          aria-label="Time format"
          options={timeOptions}
          value={form.timeFormat}
          onChange={(value) => update({ timeFormat: value as '12h' | '24h' })}
          className="w-fit"
        />
        <Small className="text-subtle-foreground">Example: {formatTimeExample(form.timeFormat, now)}</Small>
      </div>
    </div>
  )
}
