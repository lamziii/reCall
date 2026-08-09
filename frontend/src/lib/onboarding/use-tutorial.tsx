import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useUserProfile } from '@/data/live/use-user-profile'
import { completeTutorial, saveTutorialStep } from '@/data/live/onboarding'
import { ONBOARDING_STEPS, ONBOARDING_VERSION } from './tutorial-config'

export interface TutorialStore {
  isOpen: boolean
  currentStep: number
  totalSteps: number
  next: () => void
  previous: () => void
  skip: () => void
  complete: () => void
  open: () => void
  /** Escape / backdrop — leaves the tour incomplete so it can reopen next session. */
  close: () => void
  /** Reopen from Settings without touching completed/skipped state. */
  replay: () => void
}

const Ctx = createContext<TutorialStore | null>(null)

/**
 * Analytics seam. No analytics provider exists in the app, so this only logs in dev — swap the body
 * for a real `analytics.track(...)` call if one is added later (spec §25). Never add a new provider
 * just for the tour.
 */
function track(event: string, data: Record<string, unknown>) {
  if (import.meta.env.DEV) console.debug(`[tutorial] ${event}`, { version: ONBOARDING_VERSION, ...data })
}

export interface TutorialProviderProps {
  children: ReactNode
  /** Notified on skip so the shell can show the "replay in Settings" toast (only if Recall uses toasts). */
  onSkipped?: () => void
}

/**
 * Owns the product-tour state machine and its persistence. Mount once inside the authenticated
 * shell. Auto-opens exactly once per session for genuinely-new users (profile.tutorial_completed
 * === false — never for legacy accounts whose field is absent), and only after the profile has
 * loaded so it never flashes in behind Home. Writes are best-effort and never block the app.
 *
 * Replay mode (from Settings) is READ-ONLY: it never rewrites completed/skipped state.
 */
export function TutorialProvider({ children, onSkipped }: TutorialProviderProps) {
  const { user } = useAuth()
  const { profile, loading } = useUserProfile()

  const [isOpen, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  // 'auto' persists progress/completion; 'replay' is read-only.
  const modeRef = useRef<'auto' | 'replay'>('auto')
  // Auto-open must fire at most once per app session, even across navigations/re-renders.
  const autoShownRef = useRef(false)
  const totalSteps = ONBOARDING_STEPS.length
  const uid = user?.id ?? null

  // Auto-open gate: new user, profile resolved, not already shown this session.
  useEffect(() => {
    if (autoShownRef.current || loading || !profile) return
    if (profile.tutorial_completed === false) {
      autoShownRef.current = true
      modeRef.current = 'auto'
      setCurrentStep(profile.tutorial_last_step && profile.tutorial_last_step < totalSteps ? profile.tutorial_last_step : 0)
      setOpen(true)
      track('started', { trigger: 'auto', step_index: 0 })
    }
  }, [loading, profile, totalSteps])

  // Announce each viewed step (analytics).
  useEffect(() => {
    if (!isOpen) return
    track('step_viewed', { step_id: ONBOARDING_STEPS[currentStep]?.id, step_index: currentStep })
  }, [isOpen, currentStep])

  const finish = useCallback(
    (skipped: boolean) => {
      if (modeRef.current === 'auto' && uid) {
        void completeTutorial(uid, { skipped, version: ONBOARDING_VERSION, finalStep: currentStep })
      }
      track(skipped ? 'skipped' : 'completed', { step_index: currentStep })
      setOpen(false)
      if (skipped) onSkipped?.()
    },
    [uid, currentStep, onSkipped],
  )

  const next = useCallback(() => {
    setCurrentStep((s) => {
      if (s >= totalSteps - 1) {
        finish(false)
        return s
      }
      return s + 1
    })
  }, [finish, totalSteps])

  const previous = useCallback(() => setCurrentStep((s) => Math.max(0, s - 1)), [])
  const skip = useCallback(() => finish(true), [finish])
  const complete = useCallback(() => finish(false), [finish])

  const open = useCallback(() => {
    modeRef.current = 'auto'
    setCurrentStep(0)
    setOpen(true)
    track('started', { trigger: 'manual', step_index: 0 })
  }, [])

  const replay = useCallback(() => {
    modeRef.current = 'replay'
    setCurrentStep(0)
    setOpen(true)
    track('replayed', { step_index: 0 })
  }, [])

  // Escape / backdrop: leave the tour incomplete. In auto mode persist the resume pointer so it
  // reopens at the same step next session; in replay mode (already completed) just close.
  const close = useCallback(() => {
    if (modeRef.current === 'auto' && uid) void saveTutorialStep(uid, currentStep)
    track('dismissed', { step_index: currentStep })
    setOpen(false)
  }, [uid, currentStep])

  const value = useMemo<TutorialStore>(
    () => ({ isOpen, currentStep, totalSteps, next, previous, skip, complete, open, close, replay }),
    [isOpen, currentStep, totalSteps, next, previous, skip, complete, open, close, replay],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTutorial(): TutorialStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTutorial must be used within <TutorialProvider>.')
  return ctx
}
