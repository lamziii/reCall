import { motion, useReducedMotion } from 'framer-motion'
import { OnboardingMedia } from './onboarding-media'
import { OnboardingProgress } from './onboarding-progress'
import type { OnboardingStep as StepConfig } from '@/lib/onboarding/tutorial-config'

/**
 * One tour step: media area, title, description, optional helper, and a mobile-only progress row.
 * Fades + nudges in on step change (~200ms); static under reduced motion.
 */
export function OnboardingStep({
  step,
  index,
  total,
  titleId,
  descId,
}: {
  step: StepConfig
  index: number
  total: number
  titleId: string
  descId: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={step.id}
      initial={reduce ? false : { opacity: 0, x: 6 }}
      animate={reduce ? {} : { opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="px-6 pb-2 pt-6 sm:px-8"
    >
      <OnboardingMedia media={step.media} active />

      <div className="mt-6 flex flex-col gap-2">
        <h2 id={titleId} className="text-h3 font-semibold tracking-tight text-foreground">
          {step.title}
        </h2>
        <p id={descId} className="max-w-[52ch] text-body leading-relaxed text-muted-foreground">
          {step.description}
        </p>
        {step.helper && <p className="max-w-[52ch] text-small text-subtle-foreground">{step.helper}</p>}
      </div>

      {/* Progress lives in the footer on desktop; show it here on mobile where the footer is tight. */}
      <div className="mt-5 sm:hidden">
        <OnboardingProgress total={total} current={index} />
      </div>
    </motion.div>
  )
}
