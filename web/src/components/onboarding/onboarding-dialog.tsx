import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTutorial } from '@/lib/onboarding/use-tutorial'
import { ONBOARDING_STEPS } from '@/lib/onboarding/tutorial-config'
import { OnboardingStep } from './onboarding-step'
import { OnboardingFooter } from './onboarding-footer'

/**
 * The product-tour modal. Built on the native <dialog> element for free focus-trap, aria-modal and
 * top-layer semantics; Escape/backdrop route through the tour's `close()` (which leaves it
 * incomplete, per spec §16), never `complete()`. Arrow keys navigate; Enter advances. Returns focus
 * to the previously-focused element on close. ~680px on desktop, a near-full-height sheet on mobile.
 */
export function OnboardingDialog() {
  const { isOpen, currentStep, totalSteps, next, previous, skip, close } = useTutorial()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion()
  const titleId = useId()
  const descId = useId()

  // Open/close the native dialog to match state (showModal gives focus-trap + ::backdrop).
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen && !el.open) {
      restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null
      el.showModal()
    }
  }, [isOpen])

  // Keyboard: Escape → close (deliberate, incomplete); arrows navigate; Enter advances.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      // Don't hijack Enter from the focused button's own click.
      if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'BUTTON') return
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (currentStep > 0) previous()
    }
  }

  const step = ONBOARDING_STEPS[currentStep]

  return (
    <AnimatePresence onExitComplete={() => {
      dialogRef.current?.close()
      restoreFocusRef.current?.focus?.()
    }}>
      {isOpen && step && (
        <motion.dialog
          ref={dialogRef}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          onCancel={(e) => {
            e.preventDefault() // native ESC would instant-close; route through our handler
            close()
          }}
          onClick={(e) => {
            if (e.target === dialogRef.current) close() // backdrop click
          }}
          onKeyDown={onKeyDown}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="m-auto flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[680px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised p-0 text-foreground shadow-xl backdrop:bg-neutral-950/60 sm:max-h-[85vh]"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <OnboardingStep step={step} index={currentStep} total={totalSteps} titleId={titleId} descId={descId} />
          </div>
          <OnboardingFooter
            total={totalSteps}
            current={currentStep}
            onSkip={skip}
            onBack={previous}
            onNext={next}
          />
        </motion.dialog>
      )}
    </AnimatePresence>
  )
}
