import { FormField, Select } from '@/components/forms'
import { COUNTRY_OPTIONS, DATE_FORMAT_OPTIONS, LANGUAGE_OPTIONS, TIMEZONE_OPTIONS, type OnboardingData } from './types'
import { FIELD_SIZE, LABEL_STYLE } from './field-style'

export function PreferencesForm({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      <FormField label="Preferred language" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select language"
            options={LANGUAGE_OPTIONS}
            value={data.language}
            onChange={(e) => onChange({ language: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Timezone" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select timezone"
            options={TIMEZONE_OPTIONS}
            value={data.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Country" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select country"
            options={COUNTRY_OPTIONS}
            value={data.country}
            onChange={(e) => onChange({ country: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Date format" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select date format"
            options={DATE_FORMAT_OPTIONS}
            value={data.dateFormat}
            onChange={(e) => onChange({ dateFormat: e.target.value })}
          />
        )}
      </FormField>
    </div>
  )
}
