import { BookOpen, Code2, GraduationCap, Mic, Settings, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Checkbox, CheckboxGroup } from '@/components/forms'
import { USE_CASE_OPTIONS, type OnboardingData } from './types'

const ICONS: Record<string, LucideIcon> = {
  'meeting-notes': Mic,
  'internal-docs': BookOpen,
  sales: TrendingUp,
  engineering: Code2,
  recruiting: Users,
  education: GraduationCap,
  operations: Settings,
}

export function UseCaseSelection({
  data,
  onChange,
}: {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
}) {
  function toggle(value: string) {
    const next = data.useCases.includes(value) ? data.useCases.filter((v) => v !== value) : [...data.useCases, value]
    onChange({ useCases: next })
  }

  return (
    <CheckboxGroup label="What will you use Recall for?" hideLabel className="grid grid-cols-2 gap-3.5">
      {USE_CASE_OPTIONS.map((option) => {
        const Icon = ICONS[option.value]
        const checked = data.useCases.includes(option.value)
        return (
          <Checkbox
            key={option.value}
            checked={checked}
            onChange={() => toggle(option.value)}
            className="w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4.5 transition-base has-[input:checked]:border-foreground/25 has-[input:checked]:bg-surface-hover hover:bg-surface-hover"
            label={
              <span className="flex items-center gap-2 text-small font-medium text-foreground">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                {option.label}
              </span>
            }
          />
        )
      })}
    </CheckboxGroup>
  )
}
