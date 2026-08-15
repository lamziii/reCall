import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { getDb } from '@/lib/firebase/firestore'
import { getFirebaseAuth } from '@/lib/firebase/auth'
import type { NotificationType } from '@/data/types'

/**
 * Settings-owned fields on the `users/{uid}` doc — distinct from onboarding.ts, which owns the
 * onboarding-flow fields on that same doc (see the UserProfile type there).
 */

/** Ranked most → least important. Drives the default order notification types are shown in
 *  (Settings → Notifications, and eventually the Notifications page itself). */
export const DEFAULT_NOTIFICATION_PRIORITY: NotificationType[] = [
  'task-assigned',
  'mention',
  'review-required',
  'decision-approved',
  'project-update',
  'session-processed',
]

/**
 * Updates the signed-in user's name. Writes both the Firebase Auth profile (so `displayName`
 * — what AuthUser/useAuth reads elsewhere in the app, e.g. the sidebar avatar — stays in sync)
 * and the canonical `users/{uid}` doc. Returns the resulting display name.
 */
export async function updatePersonalInfo(params: { uid: string; firstName: string; lastName: string }): Promise<string> {
  const firstName = params.firstName.trim()
  const lastName = params.lastName.trim()
  const displayName = `${firstName} ${lastName}`.trim()

  const auth = getFirebaseAuth()
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: displayName || null })

  await setDoc(
    doc(getDb(), 'users', params.uid),
    {
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: displayName || null,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  )

  return displayName
}

/** Persists the user's notification-importance ranking (Settings → Notifications). */
export async function updateNotificationPriority(uid: string, order: NotificationType[]): Promise<void> {
  await setDoc(doc(getDb(), 'users', uid), { notification_priority: order, updated_at: serverTimestamp() }, { merge: true })
}
