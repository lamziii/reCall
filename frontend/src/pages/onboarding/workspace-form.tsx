import { FormField, Input, Select } from '@/components/forms'
import { INDUSTRY_OPTIONS, TEAM_SIZE_OPTIONS, type OnboardingData } from './types'
import { FIELD_SIZE, LABEL_STYLE } from './field-style'

export function WorkspaceForm({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
}) {
  return (
    <div className="flex flex-col gap-7">
      <FormField label="Workspace name" labelClassName={LABEL_STYLE} required>
        {(field) => (
          <Input
            {...field}
            className={FIELD_SIZE}
            placeholder="Acme Inc."
            value={data.workspaceName}
            onChange={(e) => onChange({ workspaceName: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Company name" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Input
            {...field}
            className={FIELD_SIZE}
            placeholder="Acme Inc."
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Team size" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select team size"
            options={TEAM_SIZE_OPTIONS}
            value={data.teamSize}
            onChange={(e) => onChange({ teamSize: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Industry" labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select industry"
            options={INDUSTRY_OPTIONS}
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
          />
        )}
      </FormField>
    </div>
  )
}
