import type { ActivityItem } from '../types'
import { hoursFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'
import { SESSION_IDS } from './sample-sessions'
import { DECISION_IDS } from './sample-decisions'

export function generateSampleActivity(): Omit<ActivityItem, '_sample'>[] {
  const { uvejs, backendEng } = PERSON_IDS
  const { recall } = PROJECT_IDS
  const { recallProductPlanning } = SESSION_IDS

  return [
    {
      id: 'activity-uvejs-updated-recall',
      actorId: uvejs,
      action: 'updated-project',
      entityType: 'project',
      entityId: recall,
      entityLabel: 'Recall',
      timestamp: hoursFromNow(-3).toISOString(),
    },
    {
      id: 'activity-backend-completed-indexeddb-audio',
      actorId: backendEng,
      action: 'completed-task',
      entityType: 'task',
      entityId: 'task-save-audio-indexeddb',
      entityLabel: 'Save recorded audio Blob to IndexedDB',
      timestamp: hoursFromNow(-22).toISOString(),
    },
    {
      id: 'activity-risk-identified-dental-plus',
      actorId: backendEng,
      action: 'identified-risk',
      entityType: 'risk',
      entityId: 'risk-dental-plus-conflicting-slots',
      entityLabel: 'Dental Plus Client Review',
      timestamp: hoursFromNow(-26).toISOString(),
    },
    {
      id: 'activity-extracted-tasks-recall-planning',
      actorId: uvejs,
      action: 'extracted-tasks',
      entityType: 'session',
      entityId: recallProductPlanning,
      entityLabel: 'Recall Product Planning',
      timestamp: hoursFromNow(-47).toISOString(),
    },
    {
      id: 'activity-uvejs-approved-session-review-decision',
      actorId: uvejs,
      action: 'approved-decision',
      entityType: 'decision',
      entityId: DECISION_IDS.shipSessionReviewFirst,
      entityLabel: 'Recall Product Planning',
      timestamp: hoursFromNow(-48).toISOString(),
    },
  ]
}
