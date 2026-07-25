import type { Question, Risk } from '../types'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'
import { SESSION_IDS } from './sample-sessions'

export function generateSampleQuestions(): Omit<Question, 'createdAt'>[] {
  const { alex, jordan } = PERSON_IDS
  const { onboarding, reliability, billing, migration } = PROJECT_IDS
  const { reliabilityRetro, growthReview, customerDiscovery, planningSync } = SESSION_IDS

  return [
    {
      id: 'question-transcription-fallback-owner',
      title: 'Who owns the transcription-provider fallback?',
      severity: 'medium',
      projectId: reliability,
      sourceSessionId: reliabilityRetro,
      status: 'open',
      nextAction: 'Assign an owner before enterprise launch.',
    },
    {
      id: 'question-legal-review-pricing',
      title: 'Does Legal need to review the annual pricing change?',
      severity: 'high',
      projectId: billing,
      sourceSessionId: growthReview,
      status: 'open',
      nextAction: 'Loop in Legal this week.',
    },
    {
      id: 'question-storage-limits-imported-recordings',
      title: 'Should imported recordings count toward storage limits?',
      severity: 'low',
      projectId: migration,
      sourceSessionId: customerDiscovery,
      status: 'open',
    },
    {
      id: 'question-migration-without-admin-access',
      title: 'Can customer migration run without admin access?',
      severity: 'medium',
      ownerId: alex,
      projectId: migration,
      sourceSessionId: customerDiscovery,
      status: 'open',
    },
    {
      id: 'question-usability-testing-blocks-launch',
      title: 'Should onboarding usability testing block the launch date?',
      severity: 'medium',
      ownerId: jordan,
      projectId: onboarding,
      sourceSessionId: planningSync,
      status: 'open',
    },
    {
      id: 'question-nav-rollout-rollback-plan',
      title: "What's the rollback plan if the phased navigation rollout fails?",
      severity: 'medium',
      ownerId: jordan,
      projectId: onboarding,
      sourceSessionId: planningSync,
      status: 'resolved',
      nextAction: 'Documented in the rollout plan.',
    },
  ]
}

export function generateSampleRisks(): Omit<Risk, 'createdAt'>[] {
  const { alex, casey, taylor, jordan } = PERSON_IDS
  const { onboarding, reliability, billing, migration } = PROJECT_IDS
  const { reliabilityRetro, customerDiscovery, growthReview, planningSync, strategySync } = SESSION_IDS

  return [
    {
      id: 'risk-transcription-reliability-below-target',
      title: 'Enterprise transcription reliability remains below target.',
      severity: 'high',
      ownerId: alex,
      projectId: reliability,
      sourceSessionId: reliabilityRetro,
      status: 'open',
      nextAction: 'Ship fallback provider before enterprise launch.',
    },
    {
      id: 'risk-migration-audit-coverage',
      title: 'Customer migration tooling has incomplete audit coverage.',
      severity: 'high',
      ownerId: casey,
      projectId: migration,
      sourceSessionId: customerDiscovery,
      status: 'open',
      nextAction: 'Close audit gaps before rollout week.',
    },
    {
      id: 'risk-pricing-tax-handling',
      title: 'Pricing launch depends on unresolved tax handling.',
      severity: 'medium',
      ownerId: taylor,
      projectId: billing,
      sourceSessionId: growthReview,
      status: 'open',
    },
    {
      id: 'risk-onboarding-usability-delay',
      title: 'Onboarding launch may slip if usability testing is delayed.',
      severity: 'medium',
      ownerId: jordan,
      projectId: onboarding,
      sourceSessionId: planningSync,
      status: 'open',
    },
    {
      id: 'risk-fallback-provider-not-contracted',
      title: 'Fallback transcription provider not yet contracted.',
      severity: 'low',
      ownerId: alex,
      projectId: reliability,
      sourceSessionId: strategySync,
      status: 'open',
    },
  ]
}
