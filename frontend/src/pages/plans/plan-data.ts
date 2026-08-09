import { PLANS, TRIAL_DAYS } from '@/data/plans'

export interface PlanFeature {
  label: string
  included: boolean
}

export interface MarketingPlan {
  id: 'pro' | 'teams' | 'enterprise'
  name: string
  tagline: string
  price: string
  priceSuffix: string
  priceNote?: string
  trialDays?: number
  features: PlanFeature[]
  cta: { label: string; href: string }
  highlighted?: boolean
}

/** Marketing copy for the public /plans page. Hours are pulled from data/plans.ts (the functional
 *  source of truth); price and feature copy live here since Enterprise isn't a real PlanTier. */
export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: 'pro',
    name: PLANS.pro.label,
    tagline: PLANS.pro.tagline,
    price: '$19',
    priceSuffix: '/month',
    trialDays: TRIAL_DAYS,
    features: [
      { label: `${PLANS.pro.maxHoursPerMonth} hours of recording per month`, included: true },
      { label: 'AI summaries, decisions & tasks', included: true },
      { label: 'Personal session library & search', included: true },
      { label: 'Shared team workspace', included: false },
    ],
    cta: { label: 'Start free trial', href: '/onboarding' },
  },
  {
    id: 'teams',
    name: PLANS.teams.label,
    tagline: PLANS.teams.tagline,
    price: '$29',
    priceSuffix: '/user/month',
    priceNote: 'The more people you add, the lower the price per seat.',
    trialDays: TRIAL_DAYS,
    features: [
      { label: `${PLANS.teams.maxHoursPerMonth} hours of recording per month`, included: true },
      { label: 'Shared team workspace', included: true },
      { label: 'Everything in Recall Pro', included: true },
      { label: 'Lower per-seat price at scale', included: true },
    ],
    cta: { label: 'Start free trial', href: '/onboarding' },
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Recall Enterprise',
    tagline: 'For organizations with custom needs.',
    price: 'Custom',
    priceSuffix: '',
    trialDays: TRIAL_DAYS,
    features: [
      { label: 'Custom recording hours', included: true },
      { label: 'Shared team workspace', included: true },
      { label: 'Dedicated customer support', included: true },
      { label: 'API access', included: true },
    ],
    cta: { label: 'Contact sales', href: 'mailto:sales@recall.app' },
  },
]
