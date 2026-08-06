import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Caption } from '@/components/typography'
import { Alert, useToast } from '@/components/feedback'
import { DURATION, EASE_STANDARD } from '@/styles/animations/presets'
import { useAuth } from '@/lib/auth/auth-context'
import { currentAuthProvider, type AuthResult } from '@/lib/auth/auth-service'
import { isDemoMode } from '@/data/live/data-mode'
import {
  beginOnboarding,
  completeOnboarding,
  loadUserProfile,
  loadWorkspaceFields,
  saveOnboardingProgress,
  type AuthProvider,
} from '@/data/live/onboarding'
import { createInvites } from '@/data/live/invites'
import { OnboardingLayout } from './onboarding-layout'
import { OnboardingHeader } from './onboarding-header'
import { OnboardingProgress } from './onboarding-progress'
import { OnboardingStep } from './onboarding-step'
import { CreateAccountStep } from './steps/create-account'
import { SecureAccountStep } from './steps/secure-account'
import { UseCaseStep } from './steps/use-case-step'
import { WorkspaceStep } from './steps/workspace-step'
import { RegionalStep } from './steps/regional-step'
import { InviteStep } from './steps/invite-step'
import { ReviewStep } from './steps/review-step'
import {
  FIRST_POST_AUTH_STEP,
  hydrateForm,
  INITIAL_FORM,
  mapFormToProfile,
  mapFormToWorkspace,
  STEP_COUNT,
  STEPS,
  stepIndexById,
  type OnboardingForm,
  type StepId,
} from './types'

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_STANDARD } },
}

/** True when the given step's required fields are filled and the user may advance. */
function canContinue(step: number, form: OnboardingForm, authed: boolean): boolean {
  const id = STEPS[step - 1]?.id
  switch (id) {
    case 'account':
      return authed // the account form drives its own submit; Continue only shows once authenticated
    case 'use-cases':
      return form.useCases.length > 0
    case 'workspace':
      return Boolean(form.workspaceName.trim() && form.workspaceType && form.teamSize)
    case 'regional':
      return Boolean(form.language)
    default:
      return true // secure, invite, review are always continuable (skippable)
  }
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const reduceMotion = useReducedMotion()

  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<OnboardingForm>(INITIAL_FORM)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const initedForUser = useRef<string | null>(null)

  const update = useCallback((patch: Partial<OnboardingForm>) => setForm((f) => ({ ...f, ...patch })), [])
  const meta = STEPS[step - 1]

  // Demo mode has no onboarding — the app is entered directly.
  useEffect(() => {
    if (isDemoMode) navigate('/app', { replace: true })
  }, [navigate])

  // Resolve auth → profile → resume point. Re-runs when the user signs in during step 1.
  useEffect(() => {
    if (isDemoMode || authLoading) return
    let cancelled = false

    async function init() {
      if (!user) {
        initedForUser.current = null
        setForm((f) => hydrateForm(f, { user: null, profile: null, workspace: null }))
        setStep(1)
        setPhase('ready')
        return
      }
      if (initedForUser.current === user.id) return // already initialised for this user
      initedForUser.current = user.id

      const profile = await loadUserProfile(user.id)
      if (cancelled) return
      if (profile?.onboarding_completed) {
        navigate('/app', { replace: true })
        return
      }
      const provider: AuthProvider = profile?.auth_provider ?? currentAuthProvider() ?? 'password'
      const wsId = await beginOnboarding(user, provider)
      const workspace = await loadWorkspaceFields(wsId)
      if (cancelled) return
      setWorkspaceId(wsId)
      setForm((f) => hydrateForm({ ...f, authProvider: provider }, { user, profile, workspace }))
      const resume = Math.min(Math.max(profile?.onboarding_step ?? FIRST_POST_AUTH_STEP, FIRST_POST_AUTH_STEP), STEP_COUNT)
      setStep(resume)
      setPhase('ready')
    }

    void init().catch(() => {
      if (!cancelled) {
        setSaveError("We couldn't load your setup. Check your connection and try again.")
        setPhase('ready')
      }
    })
    return () => {
      cancelled = true
    }
  }, [user, authLoading, navigate])

  /** Persists profile + workspace fields and the resume pointer for the given step number. */
  const persist = useCallback(
    async (nextStep: number) => {
      if (!user || !workspaceId) return
      const [firstName, ...rest] = form.fullName.trim().split(/\s+/)
      await saveOnboardingProgress({
        uid: user.id,
        workspaceId,
        step: nextStep,
        profile: {
          ...mapFormToProfile(form),
          display_name: form.fullName.trim() || null,
          first_name: firstName || null,
          last_name: rest.join(' ') || null,
        },
        workspace: mapFormToWorkspace(form),
      })
    },
    [user, workspaceId, form],
  )

  async function finish() {
    if (!user || !workspaceId) return
    const [firstName, ...rest] = form.fullName.trim().split(/\s+/)
    await completeOnboarding({
      uid: user.id,
      workspaceId,
      finalStep: STEP_COUNT,
      profile: {
        ...mapFormToProfile(form),
        display_name: form.fullName.trim() || null,
        first_name: firstName || null,
        last_name: rest.join(' ') || null,
      },
      workspace: mapFormToWorkspace(form),
    })
    if (form.invites.length > 0) {
      // Best-effort: a failed invite must not block finishing onboarding.
      const results = await createInvites(workspaceId, form.invites, { userId: user.id, name: user.name })
      const failed = results.filter((r) => !r.ok).length
      if (failed > 0) toast({ title: `${failed} invitation${failed > 1 ? 's' : ''} couldn't be created`, variant: 'warning' })
    }
    toast({ title: 'Workspace ready', description: `Welcome to ${form.workspaceName || 'Recall'}.`, variant: 'success' })
    navigate('/app', { replace: true })
  }

  async function handleContinue() {
    if (!canContinue(step, form, Boolean(user))) return
    // Default an untouched 2FA choice to "skipped" so we always store an explicit status.
    if (STEPS[step - 1].id === 'secure' && form.twoFactorStatus === null) update({ twoFactorStatus: 'skipped' })

    setSaving(true)
    setSaveError(null)
    try {
      if (step === STEP_COUNT) {
        await finish()
      } else {
        const next = step + 1
        await persist(next)
        setStep(next)
      }
    } catch {
      setSaveError("Couldn't save your progress. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    setSaveError(null)
    if (step === 1) {
      navigate('/')
      return
    }
    setStep((s) => s - 1)
  }

  const onAuthenticated = useCallback(
    (provider: AuthProvider, _result: AuthResult) => {
      // Reflect the provider immediately; the auth effect re-runs when `user` updates and advances
      // to the first post-account step.
      update({ authProvider: provider })
      setPhase('loading')
    },
    [update],
  )

  const firstName = useMemo(() => form.fullName.trim().split(/\s+/)[0], [form.fullName])
  const showFooter = !(step === 1 && !user) // step 1 for a signed-out visitor uses its own submit
  const isSkippable = meta && (meta.id === 'secure' || meta.id === 'invite')

  if (phase === 'loading') {
    return (
      <OnboardingLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" aria-label="Loading" />
        </div>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout>
      <Button variant="text" size="sm" leftIcon={<ArrowLeft />} onClick={handleBack} className="fixed left-6 top-6 md:left-10 md:top-10">
        Back
      </Button>

      <div>
        <OnboardingHeader />

        <div className="mt-12">
          <OnboardingProgress step={step} />
        </div>

        <motion.div
          className="mt-8"
          variants={reduceMotion ? undefined : itemVariants}
          initial={reduceMotion ? undefined : 'initial'}
          animate={reduceMotion ? undefined : 'animate'}
        >
          <OnboardingStep step={step}>
            {meta.id === 'account' && <CreateAccountStep form={form} update={update} authedUser={user} onAuthenticated={onAuthenticated} />}
            {meta.id === 'secure' && <SecureAccountStep form={form} update={update} />}
            {meta.id === 'use-cases' && <UseCaseStep form={form} update={update} />}
            {meta.id === 'workspace' && <WorkspaceStep form={form} update={update} firstName={firstName} />}
            {meta.id === 'regional' && <RegionalStep form={form} update={update} />}
            {meta.id === 'invite' && <InviteStep form={form} update={update} currentUserEmail={user?.email ?? form.email} />}
            {meta.id === 'review' && <ReviewStep form={form} onEdit={(id: StepId) => setStep(stepIndexById(id))} />}
          </OnboardingStep>
        </motion.div>

        {saveError && <Alert variant="danger" title={saveError} className="mt-6 text-left" />}

        {showFooter && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button size="lg" fullWidth loading={saving} disabled={!canContinue(step, form, Boolean(user))} onClick={handleContinue}>
              {step === STEP_COUNT ? 'Create workspace' : 'Continue'}
            </Button>
            {isSkippable && (
              <Button variant="text" size="sm" onClick={handleContinue} disabled={saving}>
                Skip for now
              </Button>
            )}
            <Caption className="text-subtle-foreground">You can change these anytime in Settings.</Caption>
          </div>
        )}
      </div>
    </OnboardingLayout>
  )
}
