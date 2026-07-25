import type { SessionRecord, TimelineEvent } from '../types'
import { daysFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'

export const SESSION_IDS = {
  strategySync: 'q3-product-strategy-sync',
  standup: 'weekly-engineering-standup',
  onboardingReview: 'onboarding-design-review',
  migrationPlanning: 'customer-migration-planning',
  billingReview: 'billing-architecture-review',
  growthReview: 'growth-experiment-review',
  leadershipWeekly: 'leadership-weekly',
  customerDiscovery: 'customer-discovery-acme-corp',
  reliabilityRetro: 'platform-reliability-retrospective',
  planningSync: 'product-engineering-planning',
} as const

function timelineFor(topic: string, durationMinutes: number): TimelineEvent[] {
  return [
    { label: 'Session started', offsetMinutes: 0 },
    { label: 'Intro & session goals', offsetMinutes: Math.min(6, durationMinutes - 2) },
    { label: `${topic} discussion`, offsetMinutes: Math.round(durationMinutes * 0.45) },
    { label: 'Decisions & next steps', offsetMinutes: Math.round(durationMinutes * 0.8) },
    { label: 'Action items assigned', offsetMinutes: Math.max(durationMinutes - 2, 1) },
  ]
}

/** Skeletons only — decisionIds/taskIds/questionIds/riskIds are backfilled once those records exist (see generate-sample-workspace.ts). */
export function generateSampleSessions(): SessionRecord[] {
  const { sarah, alex, jordan, taylor, casey, morgan, jamie } = PERSON_IDS
  const { onboarding, reliability, billing, migration } = PROJECT_IDS

  const base: Omit<SessionRecord, 'decisionIds' | 'taskIds' | 'questionIds' | 'riskIds'>[] = [
    {
      id: SESSION_IDS.strategySync,
      title: 'Q3 Product Strategy Sync',
      projectId: undefined,
      date: daysFromNow(-2, 10, 0).toISOString(),
      durationMinutes: 42,
      participantIds: [sarah, alex, jordan, taylor, casey],
      status: 'needs-review',
      summary:
        'We aligned on Q3 priorities, shipping the onboarding redesign before revisiting pricing. Engineering flagged a transcription-service risk that needs a fallback.',
      insights: [
        'Onboarding redesign is the clear top priority for the quarter.',
        'Pricing changes are gated on legal review of tax handling.',
      ],
      timeline: timelineFor('Q3 priorities', 42),
    },
    {
      id: SESSION_IDS.standup,
      title: 'Weekly Engineering Standup',
      projectId: reliability,
      date: daysFromNow(0, 10, 0).toISOString(),
      durationMinutes: 15,
      participantIds: [alex, morgan],
      status: 'scheduled',
      summary: 'Quick sync on platform reliability workstreams and blockers heading into the week.',
      insights: [],
      timeline: timelineFor('Reliability workstream', 15),
    },
    {
      id: SESSION_IDS.onboardingReview,
      title: 'Onboarding Design Review',
      projectId: onboarding,
      date: daysFromNow(0, 14, 30).toISOString(),
      durationMinutes: 45,
      participantIds: [sarah, jordan, taylor],
      status: 'scheduled',
      summary: 'Walk through the latest onboarding empty-state designs ahead of usability testing.',
      insights: [],
      timeline: timelineFor('Onboarding design', 45),
    },
    {
      id: SESSION_IDS.migrationPlanning,
      title: 'Customer Migration Planning',
      projectId: migration,
      date: daysFromNow(1, 11, 0).toISOString(),
      durationMinutes: 30,
      participantIds: [casey, alex, jamie],
      status: 'scheduled',
      summary: 'Plan the rollout window and support coverage for the customer migration.',
      insights: [],
      timeline: timelineFor('Migration rollout', 30),
    },
    {
      id: SESSION_IDS.billingReview,
      title: 'Billing Architecture Review',
      projectId: billing,
      date: daysFromNow(3, 13, 0).toISOString(),
      durationMinutes: 60,
      participantIds: [taylor, morgan, alex],
      status: 'scheduled',
      summary: 'Review the proposed self-serve billing architecture and integration points.',
      insights: [],
      timeline: timelineFor('Billing architecture', 60),
    },
    {
      id: SESSION_IDS.growthReview,
      title: 'Growth Experiment Review',
      projectId: billing,
      date: daysFromNow(-1, 15, 0).toISOString(),
      durationMinutes: 38,
      participantIds: [taylor, casey],
      status: 'processing',
      summary: 'Recall is still processing this recording — the executive summary and action items will appear shortly.',
      insights: [],
      timeline: timelineFor('Growth experiment', 38),
    },
    {
      id: SESSION_IDS.leadershipWeekly,
      title: 'Leadership Weekly',
      projectId: undefined,
      date: daysFromNow(2, 9, 0).toISOString(),
      durationMinutes: 30,
      participantIds: [sarah, alex, taylor, casey],
      status: 'scheduled',
      summary: 'Weekly leadership sync on cross-team priorities and risks.',
      insights: [],
      timeline: timelineFor('Cross-team priorities', 30),
    },
    {
      id: SESSION_IDS.customerDiscovery,
      title: 'Customer Discovery — Acme Corp',
      projectId: migration,
      date: daysFromNow(-5, 13, 30).toISOString(),
      durationMinutes: 50,
      participantIds: [casey, jordan],
      status: 'ready',
      summary: 'Acme Corp walked through their current workflow and migration constraints, including limited admin access.',
      insights: ['Acme needs migration to run without full admin access.', 'Storage limits are a recurring concern for imported recordings.'],
      timeline: timelineFor('Customer discovery', 50),
    },
    {
      id: SESSION_IDS.reliabilityRetro,
      title: 'Platform Reliability Retrospective',
      projectId: reliability,
      date: daysFromNow(-3, 16, 0).toISOString(),
      durationMinutes: 55,
      participantIds: [alex, morgan, sarah],
      status: 'ready',
      summary: 'Retro on last quarter’s reliability incidents — transcription-service uptime remains the biggest gap.',
      insights: ['Transcription reliability is below target for enterprise readiness.'],
      timeline: timelineFor('Reliability retro', 55),
    },
    {
      id: SESSION_IDS.planningSync,
      title: 'Product & Engineering Planning',
      projectId: onboarding,
      date: daysFromNow(-6, 10, 0).toISOString(),
      durationMinutes: 48,
      participantIds: [sarah, alex, jordan, morgan],
      status: 'ready',
      summary: 'Planned the phased rollout for onboarding and the new workspace navigation.',
      insights: ['A phased rollout reduces risk for the new workspace navigation.'],
      timeline: timelineFor('Roadmap planning', 48),
    },
  ]

  return base.map((session) => ({ ...session, decisionIds: [], taskIds: [], questionIds: [], riskIds: [] }))
}
