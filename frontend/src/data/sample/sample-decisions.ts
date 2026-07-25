import type { Decision } from '../types'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'
import { SESSION_IDS } from './sample-sessions'

export const DECISION_IDS = {
  shipOnboardingFirst: 'decision-ship-onboarding-first',
  keepMigrationWindow: 'decision-keep-migration-window',
  fallbackProvider: 'decision-fallback-provider',
  delayAnnualBilling: 'decision-delay-annual-billing',
  phasedNavRollout: 'decision-phased-nav-rollout',
  moveImportTool: 'decision-move-import-tool',
  singleAsyncUpdate: 'decision-single-async-update',
  approveFallbackProvider: 'decision-approve-fallback-provider',
  prioritizeEmptyStates: 'decision-prioritize-empty-states',
  extendMigrationSupport: 'decision-extend-migration-support',
} as const

export function generateSampleDecisions(): Decision[] {
  const { sarah, alex, jordan, taylor, casey } = PERSON_IDS
  const { onboarding, reliability, billing, migration } = PROJECT_IDS
  const { strategySync, customerDiscovery, reliabilityRetro, growthReview, planningSync } = SESSION_IDS

  const decisions: Omit<Decision, 'linkedTaskIds'>[] = [
    {
      id: DECISION_IDS.shipOnboardingFirst,
      title: 'Ship the redesigned onboarding before the pricing experiment.',
      status: 'approved',
      ownerId: sarah,
      projectId: onboarding,
      sourceSessionId: strategySync,
      confidence: 92,
      createdAt: '',
    },
    {
      id: DECISION_IDS.keepMigrationWindow,
      title: 'Keep the migration window at 30 days.',
      status: 'approved',
      ownerId: casey,
      projectId: migration,
      sourceSessionId: customerDiscovery,
      confidence: 88,
      createdAt: '',
    },
    {
      id: DECISION_IDS.fallbackProvider,
      title: 'Add a fallback transcription provider before enterprise launch.',
      status: 'pending-review',
      ownerId: alex,
      projectId: reliability,
      sourceSessionId: reliabilityRetro,
      confidence: 74,
      createdAt: '',
    },
    {
      id: DECISION_IDS.delayAnnualBilling,
      title: 'Delay annual billing until tax handling is complete.',
      status: 'proposed',
      ownerId: taylor,
      projectId: billing,
      sourceSessionId: growthReview,
      confidence: 61,
      createdAt: '',
    },
    {
      id: DECISION_IDS.phasedNavRollout,
      title: 'Use phased rollout for the new workspace navigation.',
      status: 'approved',
      ownerId: jordan,
      projectId: onboarding,
      sourceSessionId: planningSync,
      confidence: 85,
      createdAt: '',
    },
    {
      id: DECISION_IDS.moveImportTool,
      title: 'Move the customer import tool into the next sprint.',
      status: 'pending-review',
      ownerId: casey,
      projectId: migration,
      sourceSessionId: customerDiscovery,
      confidence: 70,
      createdAt: '',
    },
    {
      id: DECISION_IDS.singleAsyncUpdate,
      title: 'Adopt a single weekly async update instead of two standups.',
      status: 'superseded',
      ownerId: alex,
      projectId: reliability,
      sourceSessionId: reliabilityRetro,
      confidence: 55,
      createdAt: '',
    },
    {
      id: DECISION_IDS.approveFallbackProvider,
      title: 'Approve transcription fallback provider',
      status: 'pending-review',
      ownerId: alex,
      projectId: reliability,
      sourceSessionId: strategySync,
      confidence: 68,
      createdAt: '',
    },
    {
      id: DECISION_IDS.prioritizeEmptyStates,
      title: 'Prioritize onboarding empty states before beta invite expansion.',
      status: 'proposed',
      ownerId: jordan,
      projectId: onboarding,
      sourceSessionId: planningSync,
      confidence: 64,
      createdAt: '',
    },
    {
      id: DECISION_IDS.extendMigrationSupport,
      title: 'Extend customer migration support hours during rollout week.',
      status: 'approved',
      ownerId: casey,
      projectId: migration,
      sourceSessionId: customerDiscovery,
      confidence: 80,
      createdAt: '',
    },
  ]

  return decisions.map((d) => ({ ...d, linkedTaskIds: [] }))
}
