import type { Person } from '../types'

/** Fixed ids so other generators can reference people by a stable slug. */
export const PERSON_IDS = {
  sarah: 'sarah-chen',
  alex: 'alex-rivera',
  jordan: 'jordan-patel',
  taylor: 'taylor-kim',
  casey: 'casey-lee',
  morgan: 'morgan-reed',
  jamie: 'jamie-brooks',
} as const

export function generateSamplePeople(): Person[] {
  return [
    { id: PERSON_IDS.sarah, name: 'Sarah Chen', role: 'Product Lead', email: 'sarah@northstar.io' },
    { id: PERSON_IDS.alex, name: 'Alex Rivera', role: 'Engineering Lead', email: 'alex@northstar.io' },
    { id: PERSON_IDS.jordan, name: 'Jordan Patel', role: 'Product Designer', email: 'jordan@northstar.io' },
    { id: PERSON_IDS.taylor, name: 'Taylor Kim', role: 'Growth Lead', email: 'taylor@northstar.io' },
    { id: PERSON_IDS.casey, name: 'Casey Lee', role: 'Customer Success', email: 'casey@northstar.io' },
    { id: PERSON_IDS.morgan, name: 'Morgan Reed', role: 'Staff Engineer', email: 'morgan@northstar.io' },
    { id: PERSON_IDS.jamie, name: 'Jamie Brooks', role: 'Operations', email: 'jamie@northstar.io' },
  ]
}
