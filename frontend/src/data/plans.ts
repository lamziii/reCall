export type PlanTier = 'pro' | 'teams'

export interface PlanConfig {
  id: PlanTier
  label: string
  tagline: string
  maxHoursPerMonth: number
}

/** Single source of truth for plan metadata — onboarding, Settings, and hour-limit enforcement all read from here. */
export const PLANS: Record<PlanTier, PlanConfig> = {
  pro: { id: 'pro', label: 'Recall Pro', tagline: 'For individuals working solo.', maxHoursPerMonth: 40 },
  teams: { id: 'teams', label: 'Recall Teams', tagline: 'For teams collaborating in a shared workspace.', maxHoursPerMonth: 60 },
}

export const DEFAULT_PLAN: PlanTier = 'pro'
