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

export interface UsagePack {
  id: string
  label: string
  minutesAdded: number
  tagline: string
}

/** One-time top-ups that add extra minutes to the workspace's usage cap for the current cycle. */
export const USAGE_PACKS: UsagePack[] = [
  { id: 'small', label: '+5 hours', minutesAdded: 5 * 60, tagline: 'A quick top-up for a busy week.' },
  { id: 'medium', label: '+15 hours', minutesAdded: 15 * 60, tagline: 'Good for a heavy sprint.' },
  { id: 'large', label: '+40 hours', minutesAdded: 40 * 60, tagline: 'A full extra month of headroom.' },
]
