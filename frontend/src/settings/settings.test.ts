import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_RECALL_PREFERENCES, SETTINGS_SCHEMA_VERSION } from './defaults'
import { sanitizePreferences, validateImportedPreferences, buildPreferencesExport, PREFERENCES_EXPORT_TYPE } from './schema'
import { migratePreferences } from './migration'
import { mergeSection, sectionDefaults } from './update'
import { readLocalPreferences, writeLocalPreferences, PREFERENCES_STORAGE_KEY } from './storage'
import { searchSettings } from './settings-search'

describe('defaults', () => {
  it('are internally valid (sanitize is a no-op on defaults)', () => {
    expect(sanitizePreferences(DEFAULT_RECALL_PREFERENCES)).toEqual(DEFAULT_RECALL_PREFERENCES)
  })

  it('give a brand-new (empty) user a full valid object', () => {
    const fresh = sanitizePreferences({})
    expect(fresh.version).toBe(SETTINGS_SCHEMA_VERSION)
    expect(fresh.appearance.accentColor).toBe('blue')
    expect(fresh.productivity.quickActions).toHaveLength(4)
  })
})

describe('update immutability', () => {
  it('changing one setting does not mutate unrelated sections', () => {
    const before = structuredClone(DEFAULT_RECALL_PREFERENCES)
    const next = mergeSection(before, 'appearance', { accentColor: 'purple' })
    expect(next.appearance.accentColor).toBe('purple')
    // Other sections are referentially unchanged; the original object is untouched.
    expect(next.workspace).toBe(before.workspace)
    expect(next.ai).toBe(before.ai)
    expect(before.appearance.accentColor).toBe('blue')
  })
})

describe('persistence', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips through localStorage', () => {
    const custom = mergeSection(DEFAULT_RECALL_PREFERENCES, 'ai', { responseStyle: 'detailed' })
    writeLocalPreferences(custom)
    expect(window.localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeTruthy()
    expect(readLocalPreferences()?.ai.responseStyle).toBe('detailed')
  })

  it('returns null when nothing is stored', () => {
    expect(readLocalPreferences()).toBeNull()
  })

  it('recovers from corrupt storage instead of throwing', () => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, '{not json')
    expect(readLocalPreferences()).toBeNull()
  })
})

describe('migration', () => {
  it('fills missing keys and pins the current version', () => {
    const partial = { version: 1, appearance: { accentColor: 'emerald' } }
    const migrated = migratePreferences(partial)
    expect(migrated.version).toBe(SETTINGS_SCHEMA_VERSION)
    expect(migrated.appearance.accentColor).toBe('emerald')
    expect(migrated.appearance.radius).toBe(DEFAULT_RECALL_PREFERENCES.appearance.radius) // filled
    expect(migrated.workspace).toEqual(DEFAULT_RECALL_PREFERENCES.workspace)
  })

  it('drops invalid values back to defaults', () => {
    const bad = { appearance: { accentColor: 'neon-pink', density: 42 }, ai: { responseStyle: 'poetic' } }
    const migrated = migratePreferences(bad)
    expect(migrated.appearance.accentColor).toBe('blue')
    expect(migrated.appearance.density).toBe('default')
    expect(migrated.ai.responseStyle).toBe('balanced')
  })

  it('handles junk input without throwing', () => {
    expect(migratePreferences(null).version).toBe(SETTINGS_SCHEMA_VERSION)
    expect(migratePreferences('nope').appearance.accentColor).toBe('blue')
  })
})

describe('reset', () => {
  it('resetSection returns an independent copy of defaults', () => {
    const a = sectionDefaults('appearance')
    const b = sectionDefaults('appearance')
    expect(a).toEqual(DEFAULT_RECALL_PREFERENCES.appearance)
    a.accentColor = 'rose'
    expect(b.accentColor).toBe('blue') // no shared reference
    expect(DEFAULT_RECALL_PREFERENCES.appearance.accentColor).toBe('blue') // defaults untouched
  })

  it('resetting a section leaves other sections intact', () => {
    let prefs = mergeSection(DEFAULT_RECALL_PREFERENCES, 'ai', { responseStyle: 'detailed' })
    prefs = mergeSection(prefs, 'appearance', { accentColor: 'orange' })
    const afterReset = { ...prefs, appearance: sectionDefaults('appearance') }
    expect(afterReset.appearance.accentColor).toBe('blue')
    expect(afterReset.ai.responseStyle).toBe('detailed')
  })
})

describe('import / export', () => {
  it('export envelope contains only preferences and safe metadata', () => {
    const exported = buildPreferencesExport(DEFAULT_RECALL_PREFERENCES)
    expect(exported.type).toBe(PREFERENCES_EXPORT_TYPE)
    expect(exported.version).toBe(SETTINGS_SCHEMA_VERSION)
    expect(typeof exported.exportedAt).toBe('string')
    // Never leak auth/session/transcript data: the envelope has exactly these keys, and preferences
    // is exactly the known sections — nothing else can ride along.
    expect(Object.keys(exported)).toEqual(['type', 'version', 'exportedAt', 'preferences'])
    expect(Object.keys(exported.preferences).sort()).toEqual(
      ['advanced', 'ai', 'accessibility', 'appearance', 'experimental', 'personalization', 'productivity', 'version', 'updatedAt', 'workspace'].sort(),
    )
  })

  it('accepts a valid export and sanitizes it', () => {
    const exported = buildPreferencesExport(mergeSection(DEFAULT_RECALL_PREFERENCES, 'personalization', { timeFormat: '24h' }))
    const result = validateImportedPreferences(exported)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.personalization.timeFormat).toBe('24h')
  })

  it('rejects wrong type, non-object, and newer versions', () => {
    expect(validateImportedPreferences({ type: 'something-else', version: 1, preferences: {} }).ok).toBe(false)
    expect(validateImportedPreferences('nope').ok).toBe(false)
    expect(validateImportedPreferences({ type: PREFERENCES_EXPORT_TYPE, version: 999, preferences: {} }).ok).toBe(false)
    expect(validateImportedPreferences({ type: PREFERENCES_EXPORT_TYPE, version: 1 }).ok).toBe(false)
  })

  it('never blindly merges unknown keys from an import', () => {
    const malicious = { type: PREFERENCES_EXPORT_TYPE, version: 1, preferences: { __proto__: { hacked: true }, appearance: { evil: 'x', accentColor: 'rose' } } }
    const result = validateImportedPreferences(malicious)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.appearance.accentColor).toBe('rose')
      expect((result.value.appearance as unknown as Record<string, unknown>).evil).toBeUndefined()
    }
  })
})

describe('settings search', () => {
  it('finds a setting by keyword and reports its section', () => {
    const results = searchSettings('transcript')
    const sections = new Set(results.map((r) => r.section))
    expect(results.length).toBeGreaterThan(0)
    expect(sections.has('workspace')).toBe(true) // Transcript width
  })

  it('matches by label', () => {
    const results = searchSettings('accent')
    expect(results.some((r) => r.id === 'set-accent' && r.section === 'appearance')).toBe(true)
  })

  it('returns nothing for an empty or unmatched query', () => {
    expect(searchSettings('')).toHaveLength(0)
    expect(searchSettings('zzzznotathing')).toHaveLength(0)
  })
})
