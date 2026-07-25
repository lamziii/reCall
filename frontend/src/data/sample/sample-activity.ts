import type { ActivityItem } from '../types'
import { hoursFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'
import { SESSION_IDS } from './sample-sessions'
import { DECISION_IDS } from './sample-decisions'

export function generateSampleActivity(): Omit<ActivityItem, '_sample'>[] {
  const { sarah, alex, taylor } = PERSON_IDS
  const { onboarding } = PROJECT_IDS
  const { customerDiscovery } = SESSION_IDS

  return [
    {
      id: 'activity-jordan-updated-onboarding',
      actorId: PERSON_IDS.jordan,
      action: 'updated-project',
      entityType: 'project',
      entityId: onboarding,
      entityLabel: 'Onboarding Redesign',
      timestamp: hoursFromNow(-3).toISOString(),
    },
    {
      id: 'activity-alex-completed-fallback-monitoring',
      actorId: alex,
      action: 'completed-task',
      entityType: 'task',
      entityId: 'task-add-fallback-monitoring',
      entityLabel: 'Add fallback monitoring',
      timestamp: hoursFromNow(-22).toISOString(),
    },
    {
      id: 'activity-risk-identified-growth-review',
      actorId: taylor,
      action: 'identified-risk',
      entityType: 'risk',
      entityId: 'risk-pricing-tax-handling',
      entityLabel: 'Growth Experiment Review',
      timestamp: hoursFromNow(-26).toISOString(),
    },
    {
      id: 'activity-extracted-tasks-customer-discovery',
      actorId: alex,
      action: 'extracted-tasks',
      entityType: 'session',
      entityId: customerDiscovery,
      entityLabel: 'Customer Discovery — Acme Corp',
      timestamp: hoursFromNow(-47).toISOString(),
    },
    {
      id: 'activity-sarah-approved-strategy-decision',
      actorId: sarah,
      action: 'approved-decision',
      entityType: 'decision',
      entityId: DECISION_IDS.shipOnboardingFirst,
      entityLabel: 'Q3 Product Strategy Sync',
      timestamp: hoursFromNow(-48).toISOString(),
    },
  ]
}
