import type { Team } from '../types'
import { daysFromNow } from './date-helpers'
import { PERSON_IDS } from './sample-people'

export const TEAM_IDS = {
  engineering: 'engineering',
  productOps: 'product-ops',
} as const

export function generateSampleTeams(): Team[] {
  const { uvejs, frontendDev, backendEng, productDesigner, teamMember } = PERSON_IDS

  return [
    {
      id: TEAM_IDS.engineering,
      name: 'Engineering',
      description: 'Builds and ships majaLab’s products, from Recall to client work.',
      memberIds: [uvejs, frontendDev, backendEng],
      createdAt: daysFromNow(-120).toISOString(),
    },
    {
      id: TEAM_IDS.productOps,
      name: 'Product & Ops',
      description: 'Design, client coordination, and day-to-day operations across majaLab projects.',
      memberIds: [productDesigner, teamMember],
      createdAt: daysFromNow(-100).toISOString(),
    },
  ]
}
