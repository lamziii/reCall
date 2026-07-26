import type { Person } from '../types'

/** Fixed ids so other generators can reference people by a stable slug. */
export const PERSON_IDS = {
  uvejs: 'uvejs-mikullovci',
  productDesigner: 'product-designer',
  frontendDev: 'frontend-developer',
  backendEng: 'backend-engineer',
  teamMember: 'team-member',
} as const

/** Hackathon-scale roster: the real primary user plus generic role placeholders — no fictional identities. */
export function generateSamplePeople(): Person[] {
  return [
    { id: PERSON_IDS.uvejs, name: 'Uvejs Mikullovci', role: 'Software Engineer', email: 'uvejs@majalab.io', department: 'Engineering', status: 'active' },
    { id: PERSON_IDS.productDesigner, name: 'Product Designer', role: 'Product Designer', email: 'design@majalab.io', department: 'Design', status: 'active' },
    { id: PERSON_IDS.frontendDev, name: 'Frontend Developer', role: 'Frontend Developer', email: 'frontend@majalab.io', department: 'Engineering', status: 'active' },
    { id: PERSON_IDS.backendEng, name: 'Backend Engineer', role: 'Backend Engineer', email: 'backend@majalab.io', department: 'Engineering', status: 'away' },
    { id: PERSON_IDS.teamMember, name: 'Team Member', role: 'Team Member', email: 'team@majalab.io', department: 'Operations', status: 'offline' },
  ]
}
