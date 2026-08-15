import { Checkbox, CheckboxGroup, FormField, Input } from '@/components/forms'
import { USE_CASE_OPTIONS } from '../options'
import type { OnboardingForm } from '../types'

interface Props {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
}

/** Step 3 — multi-select use cases. Persisted to the profile so the app can later personalize the
 *  dashboard, templates, and review structure. "Other" reveals an optional free-text field. */
export function UseCaseStep({ form, update }: Props) {
  function toggle(value: string) {
    const next = form.useCases.includes(value)
      ? form.useCases.filter((v) => v !== value)
      : [...form.useCases, value]
    update({ useCases: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <CheckboxGroup label="What will you use Recall for?" hideLabel className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {USE_CASE_OPTIONS.map((option) => (
          <Checkbox
            key={option.value}
            checked={form.useCases.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-base has-[input:checked]:border-foreground/25 has-[input:checked]:bg-surface-hover hover:bg-surface-hover"
            label={<span className="text-small font-medium text-foreground">{option.label}</span>}
          />
        ))}
      </CheckboxGroup>

      {form.useCases.includes('other') && (
        <FormField label="Tell us more" optional labelClassName="font-normal text-muted-foreground">
          {(field) => (
            <Input
              {...field}
              size="lg"
              placeholder="What else will you use Recall for?"
              value={form.customUseCase}
              onChange={(e) => update({ customUseCase: e.target.value })}
            />
          )}
        </FormField>
      )}
    </div>
  )
}
