import type { Decision } from '../types'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'
import { SESSION_IDS } from './sample-sessions'

export const DECISION_IDS = {
  shipSessionReviewFirst: 'decision-ship-session-review-first',
  prioritizeDashboardWidgets: 'decision-prioritize-dashboard-widgets',
  useIndexedDbAudio: 'decision-use-indexeddb-audio',
  prioritizeEventsCalendar: 'decision-prioritize-events-calendar',
  singleCrossProjectSync: 'decision-single-cross-project-sync',
  extendBookingWindow: 'decision-extend-booking-window',
  addGradingFeature: 'decision-add-grading-feature',
  perAlbumSharing: 'decision-per-album-sharing',
  archiveGameZone: 'decision-archive-game-zone',
  shipLabenStorefront: 'decision-ship-laben-storefront',
} as const

export function generateSampleDecisions(): Decision[] {
  const { uvejs, productDesigner, frontendDev, backendEng, teamMember } = PERSON_IDS
  const { recall, eDiaspora, dentalPlus, studo, albumi, gameZone, labenFurniture } = PROJECT_IDS
  const {
    recallProductPlanning,
    recallDashboardReview,
    recallRecordingArchitecture,
    eDiasporaWeeklyPlanning,
    majaLabSprintPlanning,
    dentalPlusClientReview,
    studoFeaturePlanning,
    albumiDesignReview,
    gameZoneCoordination,
    labenFurnitureWebsiteReview,
  } = SESSION_IDS

  const decisions: Omit<Decision, 'linkedTaskIds'>[] = [
    {
      id: DECISION_IDS.shipSessionReviewFirst,
      title: 'Ship the Session Review page before polishing the dashboard.',
      status: 'approved',
      ownerId: uvejs,
      projectId: recall,
      sourceSessionId: recallProductPlanning,
      confidence: 92,
      createdAt: '',
    },
    {
      id: DECISION_IDS.prioritizeDashboardWidgets,
      title: 'Prioritize recent sessions and open tasks at the top of the dashboard.',
      status: 'approved',
      ownerId: frontendDev,
      projectId: recall,
      sourceSessionId: recallDashboardReview,
      confidence: 85,
      createdAt: '',
    },
    {
      id: DECISION_IDS.useIndexedDbAudio,
      title: 'Store recorded audio locally in IndexedDB instead of uploading it.',
      status: 'approved',
      ownerId: backendEng,
      projectId: recall,
      sourceSessionId: recallRecordingArchitecture,
      confidence: 90,
      createdAt: '',
    },
    {
      id: DECISION_IDS.prioritizeEventsCalendar,
      title: 'Prioritize the events calendar over the listings directory this sprint.',
      status: 'proposed',
      ownerId: frontendDev,
      projectId: eDiaspora,
      sourceSessionId: eDiasporaWeeklyPlanning,
      confidence: 61,
      createdAt: '',
    },
    {
      id: DECISION_IDS.singleCrossProjectSync,
      title: 'Adopt a single weekly cross-project sync instead of per-project standups.',
      status: 'pending-review',
      ownerId: uvejs,
      sourceSessionId: majaLabSprintPlanning,
      confidence: 55,
      createdAt: '',
    },
    {
      id: DECISION_IDS.extendBookingWindow,
      title: 'Extend the Dental Plus booking window to 30 days.',
      status: 'approved',
      ownerId: backendEng,
      projectId: dentalPlus,
      sourceSessionId: dentalPlusClientReview,
      confidence: 80,
      createdAt: '',
    },
    {
      id: DECISION_IDS.addGradingFeature,
      title: 'Add a grading feature to Studo’s next release.',
      status: 'proposed',
      ownerId: uvejs,
      projectId: studo,
      sourceSessionId: studoFeaturePlanning,
      confidence: 64,
      createdAt: '',
    },
    {
      id: DECISION_IDS.perAlbumSharing,
      title: 'Use per-album sharing permissions instead of per-account.',
      status: 'approved',
      ownerId: productDesigner,
      projectId: albumi,
      sourceSessionId: albumiDesignReview,
      confidence: 88,
      createdAt: '',
    },
    {
      id: DECISION_IDS.archiveGameZone,
      title: 'Archive Game Zone and document the matchmaking logic for future reuse.',
      status: 'approved',
      ownerId: teamMember,
      projectId: gameZone,
      sourceSessionId: gameZoneCoordination,
      confidence: 70,
      createdAt: '',
    },
    {
      id: DECISION_IDS.shipLabenStorefront,
      title: 'Ship the Laben Furniture storefront once inventory sync is confirmed.',
      status: 'pending-review',
      ownerId: backendEng,
      projectId: labenFurniture,
      sourceSessionId: labenFurnitureWebsiteReview,
      confidence: 68,
      createdAt: '',
    },
  ]

  return decisions.map((d) => ({ ...d, linkedTaskIds: [] }))
}
