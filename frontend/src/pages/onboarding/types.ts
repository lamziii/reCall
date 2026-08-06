import { languageLabel } from './options'
import type { InviteRole } from './options'
import type { AuthProvider, OnboardingProfileFields, OnboardingWorkspaceFields, TwoFactorStatus, UserProfile } from '@/data/live/onboarding'
import type { AuthUser } from '@/lib/auth/auth-service'
import { DEFAULT_PLAN, type PlanTier } from '@/data/plans'
import { detectRegionalDefaults } from './regional'

export interface PendingInvite {
  email: string
  role: InviteRole
}

/** The in-memory onboarding form. Password fields live here only transiently — they go straight to
 *  Firebase Auth and are NEVER persisted to Firestore. */
export interface OnboardingForm {
  // Step 1 — account (transient; password never leaves this object except to Firebase Auth)
  fullName: string
  email: string
  password: string
  confirmPassword: string
  consent: boolean
  authProvider: AuthProvider | null
  // Step 2 — security
  twoFactorStatus: TwoFactorStatus | null
  // Step 3 — use cases
  useCases: string[]
  customUseCase: string
  // Step 4 — plan
  plan: PlanTier | ''
  // Step 5 — workspace (skipped entirely when plan === 'pro')
  workspaceName: string
  workspaceType: string
  teamSize: string
  industry: string
  customIndustry: string
  // Step 6 — regional
  language: string
  country: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  // Step 7 — invites (persisted to workspace_invites on finish)
  invites: PendingInvite[]
}

export const INITIAL_FORM: OnboardingForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  consent: false,
  authProvider: null,
  twoFactorStatus: null,
  useCases: [],
  customUseCase: '',
  plan: '',
  workspaceName: '',
  workspaceType: '',
  teamSize: '',
  industry: '',
  customIndustry: '',
  language: 'en',
  country: '',
  timezone: '',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  invites: [],
}

export type StepId = 'account' | 'secure' | 'use-cases' | 'plan' | 'workspace' | 'regional' | 'invite' | 'review'

export interface StepMeta {
  id: StepId
  title: string
  description: string
}

/** Ordered step definitions. `onboarding_step` stores a 1-based index into the plan-filtered
 *  (visibleSteps) list, NOT this raw array — see visibleSteps below. */
export const STEPS: StepMeta[] = [
  { id: 'account', title: 'Create your Recall account', description: 'Start turning every conversation into clear decisions and actionable work.' },
  { id: 'secure', title: 'Secure your account', description: 'Add a second layer of protection. You can also do this later in Settings.' },
  { id: 'use-cases', title: 'What will you use Recall for?', description: 'Pick everything that applies — we use this to tailor your workspace.' },
  { id: 'plan', title: 'Choose your plan', description: 'Pick the plan that fits how you’ll use Recall. You can change this anytime in Settings.' },
  { id: 'workspace', title: 'Set up your workspace', description: 'A few details so Recall fits how your team works.' },
  { id: 'regional', title: 'Language & regional preferences', description: 'Set your language and formats. We detected what we could.' },
  { id: 'invite', title: 'Invite your team', description: 'Bring people in now, or skip and invite them later.' },
  { id: 'review', title: 'Review and finish', description: 'Make sure everything looks right before we create your workspace.' },
]

export const FIRST_POST_AUTH_STEP = 2 // step index (1-based) shown right after the account is created

/** The steps actually shown for a given plan choice — Recall Pro (solo) skips the team/workspace
 *  step entirely. An unset plan (still on the plan step itself) shows every step. */
export function visibleSteps(plan: OnboardingForm['plan']): StepMeta[] {
  return STEPS.filter((s) => s.id !== 'workspace' || plan !== 'pro')
}

export function stepIndexById(id: StepId, steps: StepMeta[]): number {
  return steps.findIndex((s) => s.id === id) + 1
}

/** Maps the form to the profile fields onboarding persists (no passwords). */
export function mapFormToProfile(form: OnboardingForm): OnboardingProfileFields {
  return {
    auth_provider: form.authProvider ?? undefined,
    preferred_language: form.language || null,
    language_label: form.language ? languageLabel(form.language) : null,
    country_code: form.country || null,
    timezone: form.timezone || null,
    date_format: form.dateFormat || null,
    time_format: form.timeFormat,
    use_cases: form.useCases,
    custom_use_case: form.useCases.includes('other') ? form.customUseCase.trim() || null : null,
    two_factor_status: form.twoFactorStatus ?? undefined,
  }
}

/** Maps the form to the workspace fields onboarding owns. */
export function mapFormToWorkspace(form: OnboardingForm): OnboardingWorkspaceFields {
  return {
    name: form.workspaceName.trim() || undefined,
    type: form.workspaceType || null,
    team_size: form.teamSize || null,
    industry: form.industry || null,
    custom_industry: form.industry === 'other' ? form.customIndustry.trim() || null : null,
    plan: form.plan || undefined,
  }
}

export interface WorkspaceSnapshotFields {
  name?: string | null
  type?: string | null
  team_size?: string | null
  industry?: string | null
  custom_industry?: string | null
  plan?: string | null
}

/**
 * Rebuilds the form when resuming: profile + workspace docs first, then the auth user's identity,
 * then locale-detected regional defaults as the final fallback. Never overwrites a value the user
 * already chose.
 */
export function hydrateForm(
  base: OnboardingForm,
  opts: { user: AuthUser | null; profile: UserProfile | null; workspace: WorkspaceSnapshotFields | null },
): OnboardingForm {
  const { user, profile, workspace } = opts
  const regional = detectRegionalDefaults()
  const defaultName = user?.name?.trim().split(/\s+/)[0]

  return {
    ...base,
    fullName: base.fullName || user?.name || profile?.display_name || '',
    email: base.email || user?.email || profile?.email || '',
    authProvider: base.authProvider ?? profile?.auth_provider ?? null,
    twoFactorStatus: base.twoFactorStatus ?? profile?.two_factor_status ?? null,
    useCases: profile?.use_cases?.length ? profile.use_cases : base.useCases,
    customUseCase: base.customUseCase || profile?.custom_use_case || '',
    plan: (base.plan || (workspace?.plan as PlanTier) || DEFAULT_PLAN) as PlanTier,
    workspaceName: base.workspaceName || workspace?.name || (defaultName ? `${defaultName}'s Workspace` : ''),
    workspaceType: base.workspaceType || workspace?.type || '',
    teamSize: base.teamSize || workspace?.team_size || '',
    industry: base.industry || workspace?.industry || '',
    customIndustry: base.customIndustry || workspace?.custom_industry || '',
    language: profile?.preferred_language || base.language || regional.language,
    country: profile?.country_code || base.country || regional.country,
    timezone: profile?.timezone || base.timezone || regional.timezone,
    dateFormat: profile?.date_format || base.dateFormat || regional.dateFormat,
    timeFormat: (profile?.time_format as '12h' | '24h') || base.timeFormat || regional.timeFormat,
  }
}
