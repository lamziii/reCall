import { useState } from 'react'
import type { NotificationType } from '@/data/types'
import { useAuth } from '@/lib/auth/auth-context'
import { useUserProfile } from './use-user-profile'
import { isDemoMode, isLiveMode } from './data-mode'
import { updateNotificationPriority, DEFAULT_NOTIFICATION_PRIORITY } from './user-settings'

const DEMO_STORAGE_KEY = 'recall:notification-priority'

function readDemoOrder(): NotificationType[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PRIORITY
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as NotificationType[]) : null
    return parsed && parsed.length === DEFAULT_NOTIFICATION_PRIORITY.length ? parsed : DEFAULT_NOTIFICATION_PRIORITY
  } catch {
    return DEFAULT_NOTIFICATION_PRIORITY
  }
}

/**
 * The signed-in user's notification-importance ranking (Settings → Notifications). Live mode
 * persists to `users/{uid}.notification_priority`; demo mode (no per-user Firestore identity)
 * uses localStorage. Falls back to DEFAULT_NOTIFICATION_PRIORITY until resolved.
 */
export function useNotificationPriority(): { order: NotificationType[]; setOrder: (order: NotificationType[]) => Promise<void> } {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const [demoOrder, setDemoOrder] = useState<NotificationType[]>(readDemoOrder)

  const order = isDemoMode ? demoOrder : (profile?.notification_priority ?? DEFAULT_NOTIFICATION_PRIORITY)

  async function setOrder(next: NotificationType[]) {
    if (isLiveMode && user) {
      await updateNotificationPriority(user.id, next)
    } else {
      setDemoOrder(next)
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next))
    }
  }

  return { order, setOrder }
}
