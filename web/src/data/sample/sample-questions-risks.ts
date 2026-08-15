import type { Question, Risk } from '../types'
import { PERSON_IDS } from './sample-people'
import { PROJECT_IDS } from './sample-projects'
import { SESSION_IDS } from './sample-sessions'

export function generateSampleQuestions(): Omit<Question, 'createdAt'>[] {
  const { uvejs, backendEng } = PERSON_IDS
  const { recall, eDiaspora, dentalPlus, studo } = PROJECT_IDS
  const { recallRecordingArchitecture, recallProductPlanning, eDiasporaWeeklyPlanning, dentalPlusClientReview, studoFeaturePlanning } = SESSION_IDS

  return [
    {
      id: 'question-transcription-fallback-owner',
      title: 'Who owns the live-transcription browser fallback?',
      severity: 'medium',
      projectId: recall,
      sourceSessionId: recallRecordingArchitecture,
      status: 'open',
      nextAction: 'Assign an owner before the demo.',
    },
    {
      id: 'question-ediaspora-multilanguage',
      title: 'Does eDiaspora need multi-language support at launch?',
      severity: 'high',
      projectId: eDiaspora,
      sourceSessionId: eDiasporaWeeklyPlanning,
      status: 'open',
      nextAction: 'Confirm with the community team.',
    },
    {
      id: 'question-ai-reviews-blocks-demo',
      title: 'Should the AI Reviews page block the hackathon demo?',
      severity: 'medium',
      projectId: recall,
      sourceSessionId: recallProductPlanning,
      status: 'open',
    },
    {
      id: 'question-dental-plus-double-confirmation',
      title: 'Can Dental Plus bookings run without double-confirmation?',
      severity: 'medium',
      ownerId: backendEng,
      projectId: dentalPlus,
      sourceSessionId: dentalPlusClientReview,
      status: 'open',
    },
    {
      id: 'question-studo-grading-timing',
      title: "Should Studo's grading feature ship before or after beta?",
      severity: 'medium',
      ownerId: uvejs,
      projectId: studo,
      sourceSessionId: studoFeaturePlanning,
      status: 'open',
    },
    {
      id: 'question-indexeddb-rollback-plan',
      title: "What's the rollback plan if IndexedDB audio storage fails?",
      severity: 'medium',
      ownerId: backendEng,
      projectId: recall,
      sourceSessionId: recallRecordingArchitecture,
      status: 'resolved',
      nextAction: 'Documented — falls back to an in-memory blob for the session.',
    },
  ]
}

export function generateSampleRisks(): Omit<Risk, 'createdAt'>[] {
  const { uvejs, frontendDev, backendEng, teamMember } = PERSON_IDS
  const { recall, eDiaspora, dentalPlus, gameZone } = PROJECT_IDS
  const { recallRecordingArchitecture, recallProductPlanning, eDiasporaWeeklyPlanning, dentalPlusClientReview, gameZoneCoordination } = SESSION_IDS

  return [
    {
      id: 'risk-transcription-reliability-varies',
      title: 'Live transcription reliability varies across browsers.',
      severity: 'high',
      ownerId: uvejs,
      projectId: recall,
      sourceSessionId: recallRecordingArchitecture,
      status: 'open',
      nextAction: 'Add a fallback for browsers without SpeechRecognition support before the demo.',
    },
    {
      id: 'risk-dental-plus-conflicting-slots',
      title: 'Dental Plus booking system risks conflicting appointment slots.',
      severity: 'high',
      ownerId: backendEng,
      projectId: dentalPlus,
      sourceSessionId: dentalPlusClientReview,
      status: 'open',
      nextAction: 'Add slot-locking before go-live.',
    },
    {
      id: 'risk-ediaspora-translation-scope',
      title: 'eDiaspora launch depends on unresolved translation scope.',
      severity: 'medium',
      ownerId: frontendDev,
      projectId: eDiaspora,
      sourceSessionId: eDiasporaWeeklyPlanning,
      status: 'open',
    },
    {
      id: 'risk-hackathon-demo-timing',
      title: "Hackathon demo may slip if the Session Review page isn't finished in time.",
      severity: 'medium',
      ownerId: uvejs,
      projectId: recall,
      sourceSessionId: recallProductPlanning,
      status: 'open',
    },
    {
      id: 'risk-game-zone-undocumented-logic',
      title: 'Game Zone matchmaking logic is undocumented outside the archived session notes.',
      severity: 'low',
      ownerId: teamMember,
      projectId: gameZone,
      sourceSessionId: gameZoneCoordination,
      status: 'open',
    },
  ]
}
