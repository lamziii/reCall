import { Button } from '@/components/ui/button'
import { OnboardingProgress } from './onboarding-progress'

/**
 * Sticky footer: Skip on the left, progress dots centered, Back/Continue on the right. Microcopy
 * per spec §31 — first step has no Back; the last step's primary is "Start using Recall".
 */
export function OnboardingFooter({
  total,
  current,
  onSkip,
  onBack,
  onNext,
}: {
  total: number
  current: number
  onSkip: () => void
  onBack: () => void
  onNext: () => void
}) {
  const isFirst = current === 0
  const isLast = current === total - 1

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
      <Button variant="text" size="sm" onClick={onSkip} className={isLast ? 'invisible' : undefined}>
        Skip
      </Button>

      <div className="hidden sm:block">
        <OnboardingProgress total={total} current={current} />
      </div>

      <div className="flex items-center gap-2">
        {!isFirst && (
          <Button variant="secondary" size="md" onClick={onBack}>
            Back
          </Button>
        )}
        <Button size="md" onClick={onNext}>
          {isLast ? 'Start using Recall' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
