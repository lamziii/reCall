import type { Project } from '../types'
import { daysFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'

export const PROJECT_IDS = {
  recall: 'recall',
  eDiaspora: 'ediaspora',
  majaLabWebsite: 'majalab-website',
  dentalPlus: 'dental-plus',
  studo: 'studo',
  albumi: 'albumi',
  labenFurniture: 'laben-furniture',
  gameZone: 'game-zone',
} as const

export function generateSampleProjects(): Project[] {
  return [
    {
      id: PROJECT_IDS.recall,
      name: 'Recall',
      description: 'majaLab’s own AI meeting recorder — live transcription, summaries, and a searchable session history.',
      status: 'active',
      ownerId: PERSON_IDS.uvejs,
      progressPct: 68,
      targetDate: daysFromNow(14).toISOString(),
      createdAt: daysFromNow(-45).toISOString(),
    },
    {
      id: PROJECT_IDS.eDiaspora,
      name: 'eDiaspora',
      description: 'Community platform connecting the diaspora with local news, services, and events.',
      status: 'active',
      ownerId: PERSON_IDS.frontendDev,
      progressPct: 45,
      targetDate: daysFromNow(30).toISOString(),
      createdAt: daysFromNow(-60).toISOString(),
    },
    {
      id: PROJECT_IDS.majaLabWebsite,
      name: 'majaLab Website',
      description: 'Marketing site and case-study showcase for majaLab’s client work.',
      status: 'planning',
      ownerId: PERSON_IDS.productDesigner,
      progressPct: 20,
      targetDate: daysFromNow(42).toISOString(),
      createdAt: daysFromNow(-20).toISOString(),
    },
    {
      id: PROJECT_IDS.dentalPlus,
      name: 'Dental Plus',
      description: 'Appointment booking and patient management for a dental clinic client.',
      status: 'at-risk',
      ownerId: PERSON_IDS.backendEng,
      progressPct: 55,
      targetDate: daysFromNow(21).toISOString(),
      createdAt: daysFromNow(-38).toISOString(),
    },
    {
      id: PROJECT_IDS.studo,
      name: 'Studo',
      description: 'Study-planning app for students to track courses, deadlines, and grades.',
      status: 'active',
      ownerId: PERSON_IDS.uvejs,
      progressPct: 30,
      targetDate: daysFromNow(75).toISOString(),
      createdAt: daysFromNow(-90).toISOString(),
    },
    {
      id: PROJECT_IDS.albumi,
      name: 'Albumi',
      description: 'Shared photo albums for families and events, with automatic organizing.',
      status: 'on-hold',
      ownerId: PERSON_IDS.productDesigner,
      progressPct: 35,
      targetDate: daysFromNow(55).toISOString(),
      createdAt: daysFromNow(-30).toISOString(),
    },
    {
      id: PROJECT_IDS.labenFurniture,
      name: 'Laben Furniture',
      description: 'E-commerce storefront and inventory system for a furniture brand.',
      status: 'done',
      ownerId: PERSON_IDS.backendEng,
      progressPct: 100,
      targetDate: daysFromNow(-10).toISOString(),
      createdAt: daysFromNow(-120).toISOString(),
    },
    {
      id: PROJECT_IDS.gameZone,
      name: 'Game Zone',
      description: 'Local matchmaking app for pickup games and casual tournaments.',
      status: 'archived',
      ownerId: PERSON_IDS.teamMember,
      progressPct: 100,
      targetDate: daysFromNow(-5).toISOString(),
      createdAt: daysFromNow(-150).toISOString(),
    },
  ]
}
