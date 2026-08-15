// Persistence for preferences. Local (localStorage) is the instant-startup cache; cloud (a
// `preferences` field on the existing users/{uid} doc — NOT a second database) syncs across devices
// for signed-in users. Reads/writes are migration-safe: everything goes through migratePreferences.

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import { isDemoMode } from '@/data/live/data-mode'
import { migratePreferences } from './migration'
import type { RecallPreferences } from './types'

export const PREFERENCES_STORAGE_KEY = 'recall-preferences'

/** Instant local read (before any network). Returns null when nothing is stored yet or it's unusable. */
export function readLocalPreferences(): RecallPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!raw) return null
    return migratePreferences(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeLocalPreferences(prefs: RecallPreferences): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Storage full / disabled — cloud sync (when signed in) is the durable copy; ignore.
  }
}

/** Reads cloud prefs from users/{uid}.preferences. Demo mode has no Firebase — always null. */
export async function readCloudPreferences(uid: string): Promise<RecallPreferences | null> {
  if (isDemoMode || !uid) return null
  try {
    const snap = await getDoc(doc(getDb(), 'users', uid))
    const stored = snap.exists() ? (snap.data() as { preferences?: unknown }).preferences : undefined
    return stored ? migratePreferences(stored) : null
  } catch {
    // Offline / denied — fall back to local. Never surface a database error to the user.
    return null
  }
}

/** Merge-writes prefs onto users/{uid}. Callers debounce this; it does one network write per call. */
export async function writeCloudPreferences(uid: string, prefs: RecallPreferences): Promise<void> {
  if (isDemoMode || !uid) return
  await setDoc(doc(getDb(), 'users', uid), { preferences: prefs, preferences_updated_at: serverTimestamp() }, { merge: true })
}
