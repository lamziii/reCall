// Runtime snapshot of preferences for NON-React consumers (e.g. the AI stream client) that can't use
// the hook. Published by RecallPreferencesProvider on every change. Read-only for consumers.

import { DEFAULT_RECALL_PREFERENCES } from './defaults'
import type { RecallPreferences } from './types'

let current: RecallPreferences = DEFAULT_RECALL_PREFERENCES

export function setRuntimePreferences(prefs: RecallPreferences): void {
  current = prefs
}

export function getRuntimePreferences(): RecallPreferences {
  return current
}
