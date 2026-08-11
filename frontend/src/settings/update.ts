import { DEFAULT_RECALL_PREFERENCES } from './defaults'
import type { RecallPreferences, SettingsSectionKey } from './types'

/**
 * Pure section merge — shallow-merges `patch` into one section, returning a NEW preferences object
 * and NEW section object while leaving every other section referentially unchanged. Extracted from
 * the context so the "changing one setting doesn't touch the others" invariant is unit-testable.
 */
export function mergeSection<K extends SettingsSectionKey>(
  prefs: RecallPreferences,
  section: K,
  patch: Partial<RecallPreferences[K]>,
): RecallPreferences {
  return { ...prefs, [section]: { ...(prefs[section] as object), ...(patch as object) } }
}

/** Returns a fresh copy of one section's defaults (never a shared reference). */
export function sectionDefaults<K extends SettingsSectionKey>(section: K): RecallPreferences[K] {
  return structuredClone(DEFAULT_RECALL_PREFERENCES[section])
}
