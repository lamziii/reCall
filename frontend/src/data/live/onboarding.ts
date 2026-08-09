import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import type { AuthUser } from '@/lib/auth/auth-service'
import type { PlanTier } from '@/data/plans'
import type { NotificationType } from '@/data/types'
import { ensureWorkspace, workspaceIdForUser } from './workspace-bootstrap'

/**
 * The onboarding source of truth. Onboarding — not the /app fallback bootstrap — owns the
 * workspace's descriptive fields and the user's onboarding status. All writes here go to the SAME
 * deterministic `ws-<uid>` workspace and `users/<uid>` profile that ensureWorkspace uses, so the
 * two never create competing documents.
 */

export type AuthProvider = 'google' | 'password'
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed'
export type TwoFactorStatus = 'enabled' | 'skipped' | 'unavailable'

/** Canonical per-account profile (`users/{uid}`). Snake_case to match the rest of the schema. */
export interface UserProfile {
  uid: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  photo_url: string | null
  workspace_id: string
  role: string
  auth_provider: AuthProvider | null
  onboarding_status: OnboardingStatus
  onboarding_step: number
  onboarding_completed: boolean
  /**
   * Product-tour state (distinct from the sign-up onboarding above). `tutorial_completed` is
   * written `false` when a new account finishes sign-up, so the tour auto-shows exactly once for
   * genuinely new users. Legacy accounts never had this field, so it reads `undefined` and the tour
   * is never forced on them. See lib/onboarding/use-tutorial.tsx.
   */
  tutorial_completed: boolean
  tutorial_skipped?: boolean
  tutorial_last_step?: number
  /** ONBOARDING_VERSION the user has completed/skipped — lets a future tour re-run cleanly. */
  tutorial_version?: number
  preferred_language: string | null
  language_label: string | null
  country_code: string | null
  timezone: string | null
  date_format: string | null
  time_format: '12h' | '24h' | null
  use_cases: string[]
  custom_use_case: string | null
  two_factor_status: TwoFactorStatus | null
  /** Notification types ranked most → least important, owned by Settings — see data/live/user-settings.ts. */
  notification_priority?: NotificationType[] | null
}

/** Profile fields onboarding may persist as the user moves through steps. */
export interface OnboardingProfileFields {
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  auth_provider?: AuthProvider
  preferred_language?: string | null
  language_label?: string | null
  country_code?: string | null
  timezone?: string | null
  date_format?: string | null
  time_format?: '12h' | '24h' | null
  use_cases?: string[]
  custom_use_case?: string | null
  two_factor_status?: TwoFactorStatus | null
}

/** Workspace fields onboarding owns (`workspaces/{ws-uid}`). */
export interface OnboardingWorkspaceFields {
  name?: string
  type?: string | null
  team_size?: string | null
  industry?: string | null
  custom_industry?: string | null
  plan?: PlanTier
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(getDb(), 'users', uid))
    return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null
  } catch {
    return null
  }
}

/** Reads the onboarding-owned workspace fields (for resuming the workspace step). */
export async function loadWorkspaceFields(workspaceId: string): Promise<OnboardingWorkspaceFields | null> {
  try {
    const snap = await getDoc(doc(getDb(), 'workspaces', workspaceId))
    if (!snap.exists()) return null
    const d = snap.data()
    return {
      name: (d.name as string) ?? undefined,
      type: (d.type as string) ?? null,
      team_size: (d.team_size as string) ?? null,
      industry: (d.industry as string) ?? null,
      custom_industry: (d.custom_industry as string) ?? null,
      plan: (d.plan as PlanTier) ?? undefined,
    }
  } catch {
    return null
  }
}

/**
 * Called once when the account exists (right after sign-up / Google auth in onboarding step 1).
 * Ensures workspace + membership + profile, then flags onboarding as in progress (unless it's
 * already completed — never regress a finished user). Returns the workspace id.
 */
export async function beginOnboarding(user: AuthUser, authProvider: AuthProvider): Promise<string> {
  const workspaceId = await ensureWorkspace(user)
  const profile = await loadUserProfile(user.id)
  if (profile?.onboarding_status !== 'completed') {
    try {
      await updateDoc(doc(getDb(), 'users', user.id), {
        auth_provider: authProvider,
        onboarding_status: 'in_progress',
        updated_at: serverTimestamp(),
      })
    } catch {
      // profile may not exist if the rule isn't deployed — non-fatal, onboarding continues in-memory
    }
  }
  return workspaceId
}

/**
 * Persists one step of onboarding: profile fields, workspace fields, and the resume pointer
 * (onboarding_step). Merge-writes so a partial failure never wipes prior answers. Best-effort on
 * both docs — a write failure surfaces to the caller so it can show an error, but never throws
 * silently.
 */
export async function saveOnboardingProgress(params: {
  uid: string
  workspaceId: string
  step: number
  profile?: OnboardingProfileFields
  workspace?: OnboardingWorkspaceFields
}): Promise<void> {
  const db = getDb()
  const { uid, workspaceId, step, profile, workspace } = params

  await setDoc(
    doc(db, 'users', uid),
    { ...cleanUndefined(profile ?? {}), onboarding_step: step, onboarding_status: 'in_progress', updated_at: serverTimestamp() },
    { merge: true },
  )

  if (workspace && Object.keys(cleanUndefined(workspace)).length > 0) {
    await updateDoc(doc(db, 'workspaces', workspaceId), { ...cleanUndefined(workspace), updated_at: serverTimestamp() })
  }
}

/** Marks onboarding complete on both the profile and the workspace. Idempotent. */
export async function completeOnboarding(params: {
  uid: string
  workspaceId: string
  finalStep: number
  profile?: OnboardingProfileFields
  workspace?: OnboardingWorkspaceFields
}): Promise<void> {
  const db = getDb()
  const { uid, workspaceId, finalStep, profile, workspace } = params

  await setDoc(
    doc(db, 'users', uid),
    {
      ...cleanUndefined(profile ?? {}),
      onboarding_step: finalStep,
      onboarding_status: 'completed',
      onboarding_completed: true,
      // Genuinely-new account → the product tour should auto-show once. Writing an explicit `false`
      // (only ever set here) is how the tour distinguishes new users from legacy accounts, which
      // have no `tutorial_completed` field at all.
      tutorial_completed: false,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )

  await updateDoc(doc(db, 'workspaces', workspaceId), {
    ...cleanUndefined(workspace ?? {}),
    onboarding_completed: true,
    updated_at: serverTimestamp(),
  })
}

// ---- Product tour (the first-run tutorial, distinct from sign-up onboarding above) -------------
// All best-effort: a failed write must never block the user from using Recall.

/** Persists the tour's resume pointer without completing it (e.g. the user pressed Escape). */
export async function saveTutorialStep(uid: string, step: number): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'users', uid), { tutorial_last_step: step, updated_at: serverTimestamp() }, { merge: true })
  } catch {
    /* non-fatal */
  }
}

/** Marks the tour finished (or skipped). Idempotent; records the version so a future tour re-runs. */
export async function completeTutorial(uid: string, opts: { skipped: boolean; version: number; finalStep: number }): Promise<void> {
  try {
    await setDoc(
      doc(getDb(), 'users', uid),
      {
        tutorial_completed: true,
        tutorial_skipped: opts.skipped,
        tutorial_version: opts.version,
        tutorial_last_step: opts.finalStep,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    )
  } catch {
    /* non-fatal */
  }
}

/** Dev-only: returns the tour to its first-run state so the auto-show flow can be re-tested. */
export async function resetTutorial(uid: string): Promise<void> {
  await setDoc(
    doc(getDb(), 'users', uid),
    { tutorial_completed: false, tutorial_skipped: false, tutorial_last_step: 0, tutorial_version: 0, updated_at: serverTimestamp() },
    { merge: true },
  )
}

export { workspaceIdForUser }

/** Drops undefined keys so a merge write never clobbers a field with `undefined`. */
function cleanUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k as keyof T] = v as T[keyof T]
  }
  return out
}
