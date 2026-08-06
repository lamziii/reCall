import { Progress } from '@/components/feedback'
import { Caption } from '@/components/typography'

export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Caption className="text-subtle-foreground">
        Step {step} of {total}
      </Caption>
      <Progress value={(step / total) * 100} label={`Onboarding step ${step} of ${total}`} className="h-1" />
    </div>
  )
}
