import { Progress } from '@/components/feedback'
import { Caption } from '@/components/typography'
import { STEP_COUNT } from './types'

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Caption className="text-subtle-foreground">
        Step {step} of {STEP_COUNT}
      </Caption>
      <Progress value={(step / STEP_COUNT) * 100} label={`Onboarding step ${step} of ${STEP_COUNT}`} className="h-1" />
    </div>
  )
}
