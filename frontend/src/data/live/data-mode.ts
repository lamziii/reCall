import { forceDemoMode } from '@/lib/firebase/config'

export type DataMode = 'live' | 'demo'

/**
 * Which data backend the app reads/writes.
 * - `live`  — authenticated user, real Firestore data (the default inside /app).
 * - `demo`  — sample localStorage data, no auth (opt in with VITE_RECALL_DEMO=true).
 *
 * There is deliberately no automatic fallback from live → demo on error: a broken live flow
 * must surface an honest error, never silently render sample data as if it were real.
 */
export function getDataMode(): DataMode {
  return forceDemoMode ? 'demo' : 'live'
}

export const isDemoMode = getDataMode() === 'demo'
export const isLiveMode = getDataMode() === 'live'
