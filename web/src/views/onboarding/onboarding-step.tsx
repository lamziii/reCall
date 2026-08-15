import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE_STANDARD } from '@/styles/animations/presets'
import { Title, Body } from '@/components/typography'
import type { StepMeta } from './types'

export function OnboardingStep({ step, meta, children }: { step: number; meta: StepMeta; children: ReactNode }) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16, transition: { duration: DURATION.fast, ease: EASE_STANDARD } }}
        className="flex flex-col gap-7"
      >
        <div className="flex flex-col gap-1.5">
          <Title>{meta.title}</Title>
          {meta.description && <Body className="text-muted-foreground">{meta.description}</Body>}
        </div>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
