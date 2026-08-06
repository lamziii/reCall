import type { DevUser } from './types'

/**
 * Local device identity for the development task board. This is ONLY task-attribution ("who is
 * Uvejs / Lorik on this laptop") — it is NOT authentication and grants no access. Real access is the
 * existing Firebase auth session that gates the route. Persisted in localStorage so it survives a
 * refresh. See docs/DEVELOPMENT_TASKBOARD.md.
 */
const STORAGE_KEY = 'recall_taskboard_user'

const VALID: DevUser[] = ['uvejs', 'lorik']

export function getIdentity(): DevUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw && (VALID as string[]).includes(raw) ? (raw as DevUser) : null
}

export function setIdentity(user: DevUser): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, user)
  } catch {
    // ignore storage failures — the caller keeps the choice in React state for this session
  }
}

export function clearIdentity(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
