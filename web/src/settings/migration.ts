// Preference migration. Today there's only v1, so migration is just sanitize (which already fills
// missing keys and drops invalid ones). The switch exists so a future rename/removal is a localized
// change: add a `case N:` that reshapes the object, fall through to the next, then sanitize.

import { SETTINGS_SCHEMA_VERSION } from './defaults'
import { sanitizePreferences } from './schema'
import type { RecallPreferences } from './types'

export function migratePreferences(saved: unknown): RecallPreferences {
  const version = saved && typeof saved === 'object' ? (saved as { version?: unknown }).version : undefined
  let working = saved

  // Step migrations run oldest → newest. Each reshapes the raw object; sanitize does the final
  // type-safe coercion. No-op today (only v1).
  switch (version) {
    // case 1: working = upgradeV1toV2(working); // fallthrough
    default:
      break
  }

  const result = sanitizePreferences(working)
  result.version = SETTINGS_SCHEMA_VERSION
  return result
}
