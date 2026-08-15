import type { Timestamp } from 'firebase/firestore'

/**
 * Internal development task board (`/tasks`) — the shared to-do list for building Recall itself,
 * split between the two developers. This is NOT the customer-facing meeting-action board at
 * `/app/tasks`; the two never share data (separate `development_tasks` collection). See
 * docs/DEVELOPMENT_TASKBOARD.md.
 */

export type DevUser = 'uvejs' | 'lorik'

export const DEV_USERS: { id: DevUser; name: string }[] = [
  { id: 'uvejs', name: 'Uvejs' },
  { id: 'lorik', name: 'Lorik' },
]

export function devUserName(id: DevUser | null | undefined): string {
  return DEV_USERS.find((u) => u.id === id)?.name ?? '—'
}

export const DEV_CATEGORIES = [
  'foundation',
  'onboarding',
  'projects',
  'reviews',
  'notifications',
  'search',
  'documents',
  'people',
  'teams',
  'settings',
  'recording',
  'transcription',
  'collaboration',
  'integrations',
  'billing',
  'cleanup',
  'testing',
  'other',
] as const
export type DevCategory = (typeof DEV_CATEGORIES)[number]

export const DEV_CATEGORY_LABELS: Record<DevCategory, string> = {
  foundation: 'Foundation',
  onboarding: 'Onboarding',
  projects: 'Projects',
  reviews: 'Reviews',
  notifications: 'Notifications',
  search: 'Search',
  documents: 'Documents',
  people: 'People',
  teams: 'Teams',
  settings: 'Settings',
  recording: 'Recording',
  transcription: 'Transcription',
  collaboration: 'Collaboration',
  integrations: 'Integrations',
  billing: 'Billing',
  cleanup: 'Cleanup',
  testing: 'Testing',
  other: 'Other',
}

export const DEV_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const
export type DevPriority = (typeof DEV_PRIORITIES)[number]

export const DEV_PRIORITY_LABELS: Record<DevPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const DEV_STATUSES = ['backlog', 'reserved', 'in_progress', 'completed'] as const
export type DevStatus = (typeof DEV_STATUSES)[number]

export const DEV_STATUS_LABELS: Record<DevStatus, string> = {
  backlog: 'Backlog',
  reserved: 'Reserved',
  in_progress: 'In progress',
  completed: 'Completed',
}

/** The stored document shape (`development_tasks/{id}`). Timestamps are Firestore Timestamps. */
export interface DevelopmentTask {
  id: string
  title: string
  description: string | null
  category: DevCategory
  priority: DevPriority
  status: DevStatus
  reserved_by: DevUser | null
  created_by: DevUser | 'system'
  completed_by: DevUser | null
  created_at: Timestamp | null
  updated_at: Timestamp | null
  reserved_at: Timestamp | null
  completed_at: Timestamp | null
  order: number
}

/** Fields the user supplies when creating/editing a task. */
export interface DevTaskInput {
  title: string
  description: string | null
  category: DevCategory
  priority: DevPriority
}
