import type { SessionRecord, TimelineEvent } from '../types'
import { daysFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'

export const SESSION_IDS = {
  recallProductPlanning: 'recall-product-planning',
  recallDashboardReview: 'recall-dashboard-review',
  recallRecordingArchitecture: 'recall-recording-architecture',
  eDiasporaWeeklyPlanning: 'ediaspora-weekly-planning',
  majaLabSprintPlanning: 'majalab-sprint-planning',
  dentalPlusClientReview: 'dental-plus-client-review',
  studoFeaturePlanning: 'studo-feature-planning',
  albumiDesignReview: 'albumi-design-review',
  gameZoneCoordination: 'game-zone-coordination',
  labenFurnitureWebsiteReview: 'laben-furniture-website-review',
} as const

/** Extra volume beyond the hand-authored "story" sessions above — lighter-weight, still coherent. */
const BULK_SESSIONS: { title: string; projectId?: string; dayOffset: number; hour: number; durationMinutes: number; participantIds: string[]; status: SessionRecord['status']; summary: string }[] = [
  { title: 'Recall Bug Triage', projectId: PROJECT_IDS.recall, dayOffset: -28, hour: 10, durationMinutes: 30, participantIds: [PERSON_IDS.uvejs, PERSON_IDS.frontendDev], status: 'needs-review', summary: 'Triaged open bugs in the recording flow — Recall flagged an unclear repro step.' },
  { title: 'Recall Command Palette Sync', projectId: PROJECT_IDS.recall, dayOffset: -26, hour: 11, durationMinutes: 25, participantIds: [PERSON_IDS.uvejs, PERSON_IDS.frontendDev], status: 'ready', summary: 'Reviewed command palette shortcuts and search ranking.' },
  { title: 'eDiaspora Backend Sync', projectId: PROJECT_IDS.eDiaspora, dayOffset: -24, hour: 14, durationMinutes: 35, participantIds: [PERSON_IDS.frontendDev, PERSON_IDS.backendEng], status: 'needs-review', summary: 'Discussed the events API schema — Recall flagged an unresolved question about timezones.' },
  { title: 'eDiaspora Content Review', projectId: PROJECT_IDS.eDiaspora, dayOffset: -22, hour: 9, durationMinutes: 30, participantIds: [PERSON_IDS.productDesigner, PERSON_IDS.frontendDev], status: 'ready', summary: 'Reviewed community-submitted listings ahead of launch.' },
  { title: 'majaLab Website Content Review', projectId: PROJECT_IDS.majaLabWebsite, dayOffset: -20, hour: 13, durationMinutes: 30, participantIds: [PERSON_IDS.productDesigner, PERSON_IDS.uvejs], status: 'needs-review', summary: 'Reviewed case-study copy — Recall flagged a claim that needs a source.' },
  { title: 'majaLab Website Copy Review', projectId: PROJECT_IDS.majaLabWebsite, dayOffset: -19, hour: 10, durationMinutes: 25, participantIds: [PERSON_IDS.productDesigner], status: 'ready', summary: 'Finalized homepage copy ahead of the next design pass.' },
  { title: 'Dental Plus Onboarding Call', projectId: PROJECT_IDS.dentalPlus, dayOffset: -17, hour: 15, durationMinutes: 35, participantIds: [PERSON_IDS.backendEng, PERSON_IDS.teamMember], status: 'ready', summary: 'Walked the client through the new booking dashboard.' },
  { title: 'Dental Plus Support Sync', projectId: PROJECT_IDS.dentalPlus, dayOffset: -15, hour: 11, durationMinutes: 30, participantIds: [PERSON_IDS.backendEng, PERSON_IDS.uvejs], status: 'needs-review', summary: 'Reviewed reported booking conflicts — Recall flagged low confidence on the root cause.' },
  { title: 'Studo Beta Testing Sync', projectId: PROJECT_IDS.studo, dayOffset: -14, hour: 10, durationMinutes: 30, participantIds: [PERSON_IDS.uvejs, PERSON_IDS.productDesigner], status: 'needs-review', summary: 'Reviewed beta tester feedback — Recall flagged conflicting signals on the grading feature.' },
  { title: 'Studo Backlog Grooming', projectId: PROJECT_IDS.studo, dayOffset: -13, hour: 14, durationMinutes: 25, participantIds: [PERSON_IDS.uvejs], status: 'ready', summary: 'Groomed the backlog ahead of next sprint.' },
  { title: 'Albumi Feature Kickoff', projectId: PROJECT_IDS.albumi, dayOffset: -12, hour: 9, durationMinutes: 30, participantIds: [PERSON_IDS.productDesigner, PERSON_IDS.frontendDev], status: 'needs-review', summary: 'Scoped the shared-album feature — Recall flagged an unclear permissions model.' },
  { title: 'Albumi Backlog Review', projectId: PROJECT_IDS.albumi, dayOffset: -10, hour: 13, durationMinutes: 20, participantIds: [PERSON_IDS.productDesigner], status: 'ready', summary: 'Reviewed the paused backlog ahead of next quarter.' },
  { title: 'Laben Furniture Inventory Sync', projectId: PROJECT_IDS.labenFurniture, dayOffset: -9, hour: 10, durationMinutes: 20, participantIds: [PERSON_IDS.backendEng], status: 'ready', summary: 'Quick status check on inventory sync before launch.' },
  { title: 'Laben Furniture Launch Retro', projectId: PROJECT_IDS.labenFurniture, dayOffset: -8, hour: 11, durationMinutes: 35, participantIds: [PERSON_IDS.backendEng, PERSON_IDS.teamMember], status: 'ready', summary: 'Retro on the storefront launch — checkout conversion is tracking above target.' },
  { title: 'Game Zone Retro', projectId: PROJECT_IDS.gameZone, dayOffset: -7, hour: 9, durationMinutes: 25, participantIds: [PERSON_IDS.teamMember, PERSON_IDS.backendEng], status: 'ready', summary: 'Closed out the project retro before archiving.' },
  { title: 'majaLab All-Hands', projectId: undefined, dayOffset: -4, hour: 10, durationMinutes: 20, participantIds: [PERSON_IDS.uvejs, PERSON_IDS.productDesigner, PERSON_IDS.frontendDev, PERSON_IDS.backendEng, PERSON_IDS.teamMember], status: 'ready', summary: 'Weekly all-hands covering progress across every active project.' },
  { title: 'Recall AI Reviews Planning', projectId: PROJECT_IDS.recall, dayOffset: -2, hour: 15, durationMinutes: 30, participantIds: [PERSON_IDS.uvejs, PERSON_IDS.frontendDev], status: 'needs-review', summary: 'Scoped the AI Reviews page — Recall flagged conflicting statements about scope.' },
  { title: 'eDiaspora Events Calendar Review', projectId: PROJECT_IDS.eDiaspora, dayOffset: 3, hour: 10, durationMinutes: 35, participantIds: [PERSON_IDS.frontendDev, PERSON_IDS.productDesigner], status: 'scheduled', summary: 'Review the events calendar design ahead of implementation.' },
  { title: 'Dental Plus Booking Flow Review', projectId: PROJECT_IDS.dentalPlus, dayOffset: 5, hour: 13, durationMinutes: 30, participantIds: [PERSON_IDS.backendEng, PERSON_IDS.teamMember], status: 'scheduled', summary: 'Check in on the reworked booking flow with the client.' },
  { title: 'Recall Mobile Layout Review', projectId: PROJECT_IDS.recall, dayOffset: 9, hour: 14, durationMinutes: 30, participantIds: [PERSON_IDS.uvejs, PERSON_IDS.productDesigner], status: 'scheduled', summary: 'Review the mobile layout pass ahead of the hackathon demo.' },
]

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
  const { uvejs, productDesigner, frontendDev, backendEng, teamMember } = PERSON_IDS
  const { recall, eDiaspora, dentalPlus, studo, albumi, gameZone, labenFurniture } = PROJECT_IDS

  const base: Omit<SessionRecord, 'decisionIds' | 'taskIds' | 'questionIds' | 'riskIds'>[] = [
    {
      id: SESSION_IDS.recallProductPlanning,
      title: 'Recall Product Planning',
      projectId: recall,
      date: daysFromNow(-2, 10, 0).toISOString(),
      durationMinutes: 42,
      participantIds: [uvejs, productDesigner, frontendDev, backendEng],
      status: 'needs-review',
      summary:
        'Aligned on priorities for the hackathon demo — finish the Session Review page and live recording flow before polishing anything else. Recall flagged a risk around browser support for live transcription.',
      insights: [
        'Session Review and live recording are the clear top priorities before the demo.',
        'Dashboard polish is explicitly deprioritized until the core flow is solid.',
      ],
      timeline: timelineFor('Recall roadmap', 42),
    },
    {
      id: SESSION_IDS.recallDashboardReview,
      title: 'Recall Dashboard Review',
      projectId: recall,
      date: daysFromNow(-3, 11, 0).toISOString(),
      durationMinutes: 40,
      participantIds: [uvejs, frontendDev],
      status: 'ready',
      summary: 'Reviewed the home dashboard layout and agreed on the widget priority order.',
      insights: ['Recent sessions and open tasks should anchor the top of the dashboard.'],
      timeline: timelineFor('Dashboard layout', 40),
    },
    {
      id: SESSION_IDS.recallRecordingArchitecture,
      title: 'Recall Recording Architecture',
      projectId: recall,
      date: daysFromNow(-6, 14, 0).toISOString(),
      durationMinutes: 48,
      participantIds: [uvejs, backendEng],
      status: 'ready',
      summary: 'Decided to store recorded audio locally in IndexedDB rather than uploading it, keeping the demo self-contained.',
      insights: ['Local-only audio storage avoids needing a backend for the hackathon demo.'],
      timeline: timelineFor('Recording architecture', 48),
    },
    {
      id: SESSION_IDS.eDiasporaWeeklyPlanning,
      title: 'eDiaspora Weekly Planning',
      projectId: eDiaspora,
      date: daysFromNow(0, 10, 0).toISOString(),
      durationMinutes: 30,
      participantIds: [frontendDev, productDesigner],
      status: 'scheduled',
      summary: 'Weekly planning for the eDiaspora community platform — events calendar and listings work.',
      insights: [],
      timeline: timelineFor('eDiaspora roadmap', 30),
    },
    {
      id: SESSION_IDS.majaLabSprintPlanning,
      title: 'majaLab Sprint Planning',
      projectId: undefined,
      date: daysFromNow(2, 9, 0).toISOString(),
      durationMinutes: 30,
      participantIds: [uvejs, productDesigner, frontendDev, backendEng],
      status: 'scheduled',
      summary: 'Cross-project sprint planning covering Recall, eDiaspora, and client work for the week ahead.',
      insights: [],
      timeline: timelineFor('Sprint planning', 30),
    },
    {
      id: SESSION_IDS.dentalPlusClientReview,
      title: 'Dental Plus Client Review',
      projectId: dentalPlus,
      date: daysFromNow(3, 13, 0).toISOString(),
      durationMinutes: 45,
      participantIds: [backendEng, teamMember],
      status: 'scheduled',
      summary: 'Walk the client through the booking dashboard and confirm the go-live checklist.',
      insights: [],
      timeline: timelineFor('Client review', 45),
    },
    {
      id: SESSION_IDS.studoFeaturePlanning,
      title: 'Studo Feature Planning',
      projectId: studo,
      date: daysFromNow(-1, 15, 0).toISOString(),
      durationMinutes: 38,
      participantIds: [uvejs, productDesigner],
      status: 'processing',
      summary: 'Recall is still processing this recording — the executive summary and action items will appear shortly.',
      insights: [],
      timeline: timelineFor('Feature planning', 38),
    },
    {
      id: SESSION_IDS.albumiDesignReview,
      title: 'Albumi Design Review',
      projectId: albumi,
      date: daysFromNow(-5, 13, 30).toISOString(),
      durationMinutes: 35,
      participantIds: [productDesigner, frontendDev],
      status: 'ready',
      summary: 'Reviewed the shared-album layout and agreed on the sharing permissions model.',
      insights: ['Album sharing needs per-album permissions, not just per-account.'],
      timeline: timelineFor('Design review', 35),
    },
    {
      id: SESSION_IDS.gameZoneCoordination,
      title: 'Game Zone Coordination',
      projectId: gameZone,
      date: daysFromNow(-9, 16, 0).toISOString(),
      durationMinutes: 25,
      participantIds: [teamMember, backendEng],
      status: 'ready',
      summary: 'Coordinated the final handoff before archiving the Game Zone project.',
      insights: ['Matchmaking logic is documented for any future revival of the project.'],
      timeline: timelineFor('Project coordination', 25),
    },
    {
      id: SESSION_IDS.labenFurnitureWebsiteReview,
      title: 'Laben Furniture Website Review',
      projectId: labenFurniture,
      date: daysFromNow(-13, 10, 0).toISOString(),
      durationMinutes: 40,
      participantIds: [backendEng, teamMember, uvejs],
      status: 'ready',
      summary: 'Final review of the storefront before launch — checkout and inventory sync both signed off.',
      insights: ['Checkout flow is ready; inventory sync is the last blocker before launch.'],
      timeline: timelineFor('Website review', 40),
    },
  ]

  const bulk: Omit<SessionRecord, 'decisionIds' | 'taskIds' | 'questionIds' | 'riskIds'>[] = BULK_SESSIONS.map((s) => ({
    id: `session-${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    title: s.title,
    projectId: s.projectId,
    date: daysFromNow(s.dayOffset, s.hour, 0).toISOString(),
    durationMinutes: s.durationMinutes,
    participantIds: s.participantIds,
    status: s.status,
    summary: s.summary,
    insights: [],
    timeline: timelineFor(s.title, s.durationMinutes),
  }))

  return [...base, ...bulk].map((session) => ({ ...session, decisionIds: [], taskIds: [], questionIds: [], riskIds: [] }))
}
