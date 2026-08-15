import { useMemo } from 'react'
import { useMediaQuery } from '@/hooks'
import { useRecallPreferences } from './settings-context'
import { resolvePreferences, type ResolvedPreferences } from './resolve'

/** Effective runtime flags with precedence applied (see resolve.ts). Live — updates when the user
 *  changes a setting or the OS reduced-motion preference flips. */
export function useResolvedPreferences(): ResolvedPreferences {
  const { preferences } = useRecallPreferences()
  const systemReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  return useMemo(() => resolvePreferences(preferences, { systemReduceMotion }), [preferences, systemReduceMotion])
}

/** Convenience: the one canonical "should motion be suppressed" flag (OS + user + animations-off). */
export function useEffectiveReduceMotion(): boolean {
  return useResolvedPreferences().reduceMotion
}
