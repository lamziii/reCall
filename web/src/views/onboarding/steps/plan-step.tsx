import { Radio, RadioGroup } from '@/components/forms'
import { PLAN_OPTIONS } from '../options'
import type { OnboardingForm } from '../types'

interface Props {
  form: OnboardingForm
  update: (patch: Partial<OnboardingForm>) => void
}

/** Step 4 — single-select plan choice. Recall Pro skips the workspace/team step entirely (see
 *  visibleSteps in ../types.ts); Recall Teams keeps it. Also gates the monthly recording-hour cap. */
export function PlanStep({ form, update }: Props) {
  return (
    <RadioGroup name="plan" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {PLAN_OPTIONS.map((option) => (
        <Radio
          key={option.value}
          checked={form.plan === option.value}
          onChange={() => update({ plan: option.value })}
          className="w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-base has-[input:checked]:border-foreground/25 has-[input:checked]:bg-surface-hover hover:bg-surface-hover"
          label={<span className="text-small font-medium text-foreground">{option.label}</span>}
          description={option.description}
        />
      ))}
    </RadioGroup>
  )
}
