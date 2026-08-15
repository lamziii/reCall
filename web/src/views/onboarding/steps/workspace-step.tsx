import { FormField, Input, Select } from '@/components/forms'
import { INDUSTRY_OPTIONS, PERSONAL_WORKSPACE_TYPES, TEAM_SIZE_OPTIONS, WORKSPACE_TYPE_OPTIONS } from '../options'
import type { OnboardingForm } from '../types'

const FIELD_SIZE = 'h-14 rounded-xl border-border-subtle bg-surface-raised text-body focus:border-accent/50 focus:ring-[3px] focus:ring-accent/15'
const LABEL_STYLE = 'font-normal text-muted-foreground'

interface Props {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
  firstName?: string
}

/** Step 4 — workspace. Name + type + team size are required; industry is optional. No redundant
 *  "company name" field. Choosing a personal/freelance type defaults the name to the user's first
 *  name (still editable). */
export function WorkspaceStep({ form, update, firstName }: Props) {
  function onTypeChange(type: string) {
    const patch: Partial<OnboardingForm> = { workspaceType: type }
    // If the user hasn't named their workspace yet and picks a personal type, suggest their name.
    if (PERSONAL_WORKSPACE_TYPES.has(type) && !form.workspaceName.trim() && firstName) {
      patch.workspaceName = `${firstName}'s Workspace`
    }
    update(patch)
  }

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Workspace name" labelClassName={LABEL_STYLE} required>
        {(field) => (
          <Input
            {...field}
            className={FIELD_SIZE}
            placeholder="majaLab, Innovation Hub, Acme Product Team…"
            value={form.workspaceName}
            onChange={(e) => update({ workspaceName: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Workspace type" labelClassName={LABEL_STYLE} required>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select a type"
            options={WORKSPACE_TYPE_OPTIONS}
            value={form.workspaceType}
            onChange={(e) => onTypeChange(e.target.value)}
          />
        )}
      </FormField>

      <FormField label="Team size" labelClassName={LABEL_STYLE} required>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select team size"
            options={TEAM_SIZE_OPTIONS}
            value={form.teamSize}
            onChange={(e) => update({ teamSize: e.target.value })}
          />
        )}
      </FormField>

      <FormField label="Industry" optional labelClassName={LABEL_STYLE}>
        {(field) => (
          <Select
            {...field}
            className={FIELD_SIZE}
            placeholder="Select industry"
            options={INDUSTRY_OPTIONS}
            value={form.industry}
            onChange={(e) => update({ industry: e.target.value })}
          />
        )}
      </FormField>

      {form.industry === 'other' && (
        <FormField label="Your industry" optional labelClassName={LABEL_STYLE}>
          {(field) => (
            <Input
              {...field}
              className={FIELD_SIZE}
              placeholder="Type your industry"
              value={form.customIndustry}
              onChange={(e) => update({ customIndustry: e.target.value })}
            />
          )}
        </FormField>
      )}
    </div>
  )
}
