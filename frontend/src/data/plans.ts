export type PlanTier = 'pro' | 'teams'

export interface PlanConfig {
  id: PlanTier
  label: string
  tagline: string
  maxHoursPerMonth: number
  /** Included Recall AI questions per calendar month. Enforced server-side in recallAiChat; the
   *  same numbers are mirrored there (functions can't import this file). */
  maxAiQuestionsPerMonth: number
}

/** Single source of truth for plan metadata — onboarding, Settings, and hour-limit enforcement all read from here. */
export const PLANS: Record<PlanTier, PlanConfig> = {
  pro: { id: 'pro', label: 'Recall Pro', tagline: 'For individuals working solo.', maxHoursPerMonth: 40, maxAiQuestionsPerMonth: 100 },
  teams: { id: 'teams', label: 'Recall Teams', tagline: 'For teams collaborating in a shared workspace.', maxHoursPerMonth: 60, maxAiQuestionsPerMonth: 200 },
}

export const DEFAULT_PLAN: PlanTier = 'pro'

/** Length of the free trial every new workspace starts on, anchored to Workspace.createdAt /
 *  the live workspace doc's created_at. Single source of truth for both the marketing copy
 *  (pages/plans) and the real countdown shown on the Usage page. */
export const TRIAL_DAYS = 7

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

export interface AiQuestionPack {
  id: string
  label: string
  questionsAdded: number
  tagline: string
}

/** One-time top-ups that add extra Recall AI questions to the workspace's monthly limit. */
export const AI_QUESTION_PACKS: AiQuestionPack[] = [
  { id: 'ai-small', label: '+50 questions', questionsAdded: 50, tagline: 'A little extra for a busy week.' },
  { id: 'ai-medium', label: '+200 questions', questionsAdded: 200, tagline: 'Double a Pro plan.' },
  { id: 'ai-large', label: '+1,000 questions', questionsAdded: 1000, tagline: 'Plenty of headroom for the team.' },
]
