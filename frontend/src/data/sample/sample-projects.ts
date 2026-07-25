import type { Project } from '../types'
import { daysFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'

export const PROJECT_IDS = {
  onboarding: 'onboarding-redesign',
  reliability: 'q3-platform-reliability',
  billing: 'self-serve-billing',
  migration: 'customer-migration',
  growthExperiments: 'growth-experiments-platform',
  legacyApiSunset: 'legacy-api-sunset',
} as const

export function generateSampleProjects(): Project[] {
  return [
    {
      id: PROJECT_IDS.onboarding,
      name: 'Onboarding Redesign',
      description: 'Rebuilding first-run onboarding to cut time-to-value for new workspaces.',
      status: 'active',
      ownerId: PERSON_IDS.sarah,
      progressPct: 72,
      targetDate: daysFromNow(14).toISOString(),
      createdAt: daysFromNow(-45).toISOString(),
    },
    {
      id: PROJECT_IDS.reliability,
      name: 'Q3 Platform Reliability',
      description: 'Closing the reliability gaps blocking enterprise launch, starting with transcription uptime.',
      status: 'at-risk',
      ownerId: PERSON_IDS.alex,
      progressPct: 48,
      targetDate: daysFromNow(30).toISOString(),
      createdAt: daysFromNow(-60).toISOString(),
    },
    {
      id: PROJECT_IDS.billing,
      name: 'Self-Serve Billing',
      description: 'Self-serve upgrade and billing architecture for teams outgrowing the trial plan.',
      status: 'planning',
      ownerId: PERSON_IDS.taylor,
      progressPct: 20,
      targetDate: daysFromNow(42).toISOString(),
      createdAt: daysFromNow(-20).toISOString(),
    },
    {
      id: PROJECT_IDS.migration,
      name: 'Customer Migration',
      description: 'Migrating enterprise customers off the legacy import tool with zero data loss.',
      status: 'active',
      ownerId: PERSON_IDS.casey,
      progressPct: 61,
      targetDate: daysFromNow(21).toISOString(),
      createdAt: daysFromNow(-38).toISOString(),
    },
    {
      id: PROJECT_IDS.growthExperiments,
      name: 'Growth Experiments Platform',
      description: 'An internal framework for running and measuring growth experiments, paused for this quarter.',
      status: 'on-hold',
      ownerId: PERSON_IDS.taylor,
      progressPct: 35,
      targetDate: daysFromNow(75).toISOString(),
      createdAt: daysFromNow(-90).toISOString(),
    },
    {
      id: PROJECT_IDS.legacyApiSunset,
      name: 'Legacy API Sunset',
      description: 'Decommissioning the v1 public API now that all customers have migrated to v2.',
      status: 'archived',
      ownerId: PERSON_IDS.morgan,
      progressPct: 100,
      targetDate: daysFromNow(-10).toISOString(),
      createdAt: daysFromNow(-120).toISOString(),
    },
  ]
}
