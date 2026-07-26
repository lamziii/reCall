import type { TaskStatusValue } from '@/components/recall/task-status'
import type { Priority } from '@/components/data-display/priority-badge'
import type { Task } from '../types'
import { daysFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'
import { SESSION_IDS } from './sample-sessions'
import { DECISION_IDS } from './sample-decisions'

const TASK_VERBS = ['Draft', 'Review', 'Update', 'Finalize', 'Investigate', 'Document', 'Test', 'Ship', 'Audit', 'Follow up on', 'Prepare', 'Sync on']
const TASK_SUBJECTS = [
  'session review copy',
  'booking edge cases',
  'events calendar schema',
  'inventory sync',
  'grading feature',
  'album permissions',
  'matchmaking logic',
  'design tokens',
  'homepage copy',
  'client feedback',
  'release notes',
  'security review',
  'analytics events',
  'onboarding flow',
]

const BULK_STATUS_CYCLE: TaskStatusValue[] = ['todo', 'todo', 'in-progress', 'todo', 'done', 'in-progress', 'blocked', 'todo', 'done', 'backlog']
const BULK_PRIORITY_CYCLE: Priority[] = ['medium', 'low', 'high', 'medium', 'urgent', 'medium', 'high', 'low']

/** Procedural volume on top of the hand-authored tasks above — deterministic, not random, so the seed is stable across regenerations. */
function generateBulkTasks(count: number): Task[] {
  const projectIds = Object.values(PROJECT_IDS)
  const personIds = Object.values(PERSON_IDS)
  const sessionIds = Object.values(SESSION_IDS)

  return Array.from({ length: count }, (_, i) => {
    const verb = TASK_VERBS[i % TASK_VERBS.length]
    const subject = TASK_SUBJECTS[(i * 7) % TASK_SUBJECTS.length]
    const status = BULK_STATUS_CYCLE[i % BULK_STATUS_CYCLE.length]
    const priority = BULK_PRIORITY_CYCLE[i % BULK_PRIORITY_CYCLE.length]
    const projectId = projectIds[i % projectIds.length]
    const assigneeId = personIds[(i * 3) % personIds.length]
    const dueOffset = ((i * 5) % 45) - 15 // spread from 15 days overdue to 30 days out
    const hasSession = i % 3 === 0
    const isDone = status === 'done'

    return {
      id: `task-bulk-${i}`,
      title: `${verb} ${subject}`,
      projectId,
      assigneeId,
      dueDate: isDone ? undefined : daysFromNow(dueOffset).toISOString(),
      sourceSessionId: hasSession ? sessionIds[i % sessionIds.length] : undefined,
      status,
      priority,
      completedAt: isDone ? daysFromNow(Math.min(dueOffset, -1)).toISOString() : undefined,
      blocker: status === 'blocked' ? 'Waiting on input from a client.' : undefined,
    }
  })
}

export function generateSampleTasks(): Task[] {
  const { uvejs, productDesigner, frontendDev, backendEng, teamMember } = PERSON_IDS
  const { recall, eDiaspora, dentalPlus, studo, albumi, gameZone, labenFurniture } = PROJECT_IDS
  const { recallProductPlanning, recallDashboardReview, eDiasporaWeeklyPlanning, dentalPlusClientReview, studoFeaturePlanning, albumiDesignReview, gameZoneCoordination, labenFurnitureWebsiteReview } =
    SESSION_IDS

  return [
    {
      id: 'task-finish-session-review-page',
      title: 'Finish the Session Review page layout',
      projectId: recall,
      assigneeId: uvejs,
      dueDate: daysFromNow(-1).toISOString(),
      sourceSessionId: recallProductPlanning,
      status: 'in-progress',
      priority: 'urgent',
      relatedDecisionId: DECISION_IDS.shipSessionReviewFirst,
    },
    {
      id: 'task-wire-recent-sessions-widget',
      title: 'Wire up the recent sessions dashboard widget',
      projectId: recall,
      assigneeId: frontendDev,
      dueDate: daysFromNow(0).toISOString(),
      sourceSessionId: recallDashboardReview,
      status: 'todo',
      priority: 'high',
      relatedDecisionId: DECISION_IDS.prioritizeDashboardWidgets,
    },
    {
      id: 'task-save-audio-indexeddb',
      title: 'Save recorded audio Blob to IndexedDB',
      projectId: recall,
      assigneeId: backendEng,
      dueDate: daysFromNow(-2).toISOString(),
      status: 'done',
      priority: 'urgent',
      completedAt: daysFromNow(-2).toISOString(),
    },
    {
      id: 'task-events-api-timezones',
      title: 'Resolve timezone handling in the events API',
      projectId: eDiaspora,
      assigneeId: backendEng,
      dueDate: daysFromNow(4).toISOString(),
      sourceSessionId: eDiasporaWeeklyPlanning,
      status: 'todo',
      priority: 'medium',
    },
    {
      id: 'task-events-calendar-design',
      title: 'Prioritize events calendar design over listings',
      projectId: eDiaspora,
      assigneeId: productDesigner,
      dueDate: daysFromNow(6).toISOString(),
      status: 'todo',
      priority: 'medium',
      relatedDecisionId: DECISION_IDS.prioritizeEventsCalendar,
    },
    {
      id: 'task-extend-booking-window',
      title: 'Extend Dental Plus booking window to 30 days',
      projectId: dentalPlus,
      assigneeId: backendEng,
      dueDate: daysFromNow(1).toISOString(),
      sourceSessionId: dentalPlusClientReview,
      status: 'in-progress',
      priority: 'high',
      relatedDecisionId: DECISION_IDS.extendBookingWindow,
    },
    {
      id: 'task-fix-booking-conflicts',
      title: 'Fix reported booking conflicts',
      projectId: dentalPlus,
      assigneeId: backendEng,
      dueDate: daysFromNow(-1).toISOString(),
      status: 'blocked',
      priority: 'urgent',
      blocker: 'Waiting on a repro case from the client.',
    },
    {
      id: 'task-add-grading-feature',
      title: 'Add grading feature to Studo',
      projectId: studo,
      assigneeId: uvejs,
      dueDate: daysFromNow(8).toISOString(),
      sourceSessionId: studoFeaturePlanning,
      status: 'todo',
      priority: 'medium',
      relatedDecisionId: DECISION_IDS.addGradingFeature,
    },
    {
      id: 'task-album-sharing-permissions',
      title: 'Implement per-album sharing permissions',
      projectId: albumi,
      assigneeId: productDesigner,
      dueDate: daysFromNow(5).toISOString(),
      sourceSessionId: albumiDesignReview,
      status: 'todo',
      priority: 'medium',
      relatedDecisionId: DECISION_IDS.perAlbumSharing,
    },
    {
      id: 'task-document-matchmaking-logic',
      title: 'Document matchmaking logic before archiving Game Zone',
      projectId: gameZone,
      assigneeId: teamMember,
      status: 'done',
      priority: 'low',
      sourceSessionId: gameZoneCoordination,
      completedAt: daysFromNow(-9).toISOString(),
      relatedDecisionId: DECISION_IDS.archiveGameZone,
    },
    {
      id: 'task-confirm-inventory-sync',
      title: 'Confirm inventory sync before Laben Furniture launch',
      projectId: labenFurniture,
      assigneeId: backendEng,
      dueDate: daysFromNow(2).toISOString(),
      sourceSessionId: labenFurnitureWebsiteReview,
      status: 'in-progress',
      priority: 'high',
      relatedDecisionId: DECISION_IDS.shipLabenStorefront,
    },
    {
      id: 'task-prep-demo-script',
      title: 'Prepare the hackathon demo script',
      assigneeId: uvejs,
      dueDate: daysFromNow(1).toISOString(),
      status: 'todo',
      priority: 'urgent',
    },
    ...generateBulkTasks(24),
  ]
}
