import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { DEFAULT_RECALL_PREFERENCES } from './defaults'
import { applyPreferences } from './apply-preferences'
import { setFormatPreferences } from './format'
import { setRuntimePreferences } from './runtime'
import { readCloudPreferences, readLocalPreferences, writeCloudPreferences, writeLocalPreferences } from './storage'
import { mergeSection, sectionDefaults } from './update'
import type { RecallPreferences, SettingsSectionKey } from './types'

const CLOUD_SYNC_DEBOUNCE_MS = 800

export interface RecallPreferencesContextValue {
  preferences: RecallPreferences
  /** Shallow-merge a section (nested groups like `animations` are replaced by the patch you pass). */
  updateSection: <K extends SettingsSectionKey>(section: K, patch: Partial<RecallPreferences[K]>) => void
  /** Replace the whole preferences object (used by import). */
  replacePreferences: (next: RecallPreferences) => void
  resetAll: () => void
  resetSection: (section: SettingsSectionKey) => void
  isLoaded: boolean
  isSyncing: boolean
  /** True the moment a change is made, false again shortly after it's persisted — drives "Saved". */
  hasPendingSync: boolean
}

const Ctx = createContext<RecallPreferencesContextValue | null>(null)

export function useRecallPreferences(): RecallPreferencesContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRecallPreferences() must be used inside <RecallPreferencesProvider>')
  return ctx
}

function stamp(prefs: RecallPreferences): RecallPreferences {
  return { ...prefs, updatedAt: Date.now() }
}

export function RecallPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  // Local cache is synchronous, so the first paint already has the right settings (no flash).
  const [preferences, setPreferencesState] = useState<RecallPreferences>(() => readLocalPreferences() ?? DEFAULT_RECALL_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasPendingSync, setHasPendingSync] = useState(false)

  const uidRef = useRef<string | null>(null)
  uidRef.current = user?.id ?? null
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRef = useRef(preferences)
  latestRef.current = preferences

  // Reflect onto <html> whenever preferences change, and publish date/time prefs to the formatter
  // store so shared formatters (data/home/format.ts, DueDate, …) pick them up.
  useEffect(() => {
    applyPreferences(preferences)
    setFormatPreferences(preferences.personalization)
    setRuntimePreferences(preferences)
  }, [preferences])

  const flushToCloud = useCallback(async () => {
    const uid = uidRef.current
    if (!uid) {
      setHasPendingSync(false)
      return
    }
    setIsSyncing(true)
    try {
      await writeCloudPreferences(uid, latestRef.current)
    } catch {
      // Keep local prefs active; a later change retries. Never block the user on a sync failure.
    } finally {
      setIsSyncing(false)
      setHasPendingSync(false)
    }
  }, [])

  const scheduleCloudSync = useCallback(() => {
    setHasPendingSync(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void flushToCloud(), CLOUD_SYNC_DEBOUNCE_MS)
  }, [flushToCloud])

  // Commit: update state + local cache immediately, debounce the cloud write.
  const commit = useCallback(
    (next: RecallPreferences) => {
      const stamped = stamp(next)
      latestRef.current = stamped
      setPreferencesState(stamped)
      writeLocalPreferences(stamped)
      scheduleCloudSync()
    },
    [scheduleCloudSync],
  )

  // One-time cloud reconciliation on sign-in: newest-wins by updatedAt so a change made on another
  // device restores here, but a change the user JUST made locally is never clobbered by stale cloud.
  useEffect(() => {
    let cancelled = false
    const uid = user?.id
    if (!uid) {
      setIsLoaded(true)
      return
    }
    void (async () => {
      const cloud = await readCloudPreferences(uid)
      if (cancelled) return
      if (cloud && cloud.updatedAt > latestRef.current.updatedAt) {
        latestRef.current = cloud
        setPreferencesState(cloud)
        writeLocalPreferences(cloud)
      } else if (!cloud && latestRef.current.updatedAt > 0) {
        // First device with local prefs but nothing in cloud yet — seed the cloud copy.
        void writeCloudPreferences(uid, latestRef.current).catch(() => {})
      }
      setIsLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Flush any pending write on unmount so a fast navigate-away doesn't drop the last change.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        void flushToCloud()
      }
    }
  }, [flushToCloud])

  const updateSection = useCallback<RecallPreferencesContextValue['updateSection']>(
    (section, patch) => commit(mergeSection(latestRef.current, section, patch)),
    [commit],
  )

  const replacePreferences = useCallback((next: RecallPreferences) => commit(next), [commit])

  const resetAll = useCallback(() => commit(structuredClone(DEFAULT_RECALL_PREFERENCES)), [commit])

  const resetSection = useCallback(
    (section: SettingsSectionKey) => commit({ ...latestRef.current, [section]: sectionDefaults(section) }),
    [commit],
  )

  const value = useMemo<RecallPreferencesContextValue>(
    () => ({ preferences, updateSection, replacePreferences, resetAll, resetSection, isLoaded, isSyncing, hasPendingSync }),
    [preferences, updateSection, replacePreferences, resetAll, resetSection, isLoaded, isSyncing, hasPendingSync],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
