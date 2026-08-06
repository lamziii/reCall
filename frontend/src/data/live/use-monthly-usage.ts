import { useEffect, useState } from 'react'
import { getWorkspaceData } from '@/data/workspace-repository'
import { isDemoMode, isLiveMode } from './data-mode'
import { useWorkspace } from './workspace-context'
import { subscribeSessions } from './live-store'
import { sessionDurationMinutes, tsToIso } from './mappers'
import type { LiveSessionDoc } from './types'

function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

/** Sum of recorded minutes across the workspace's sessions created in the current calendar month. */
export function useMonthlyUsageMinutes(): number {
  return useMonthlyUsageStats().minutes
}

export interface MonthlyUsageStats {
  minutes: number
  sessionCount: number
}

/** Minutes used and session count for the workspace's sessions created in the current calendar month. */
export function useMonthlyUsageStats(): MonthlyUsageStats {
  const { workspaceId } = useWorkspace()
  const [sessions, setSessions] = useState<LiveSessionDoc[]>([])

  useEffect(() => {
    if (!isLiveMode) return
    return subscribeSessions(workspaceId, setSessions, () => {})
  }, [workspaceId])

  if (isDemoMode) {
    const data = getWorkspaceData()
    if (!data) return { minutes: 0, sessionCount: 0 }
    const thisMonth = data.sessions.filter((s) => isThisMonth(s.date))
    return { minutes: thisMonth.reduce((sum, s) => sum + s.durationMinutes, 0), sessionCount: thisMonth.length }
  }

  const thisMonth = sessions.filter((s) => isThisMonth(tsToIso(s.created_at)))
  return { minutes: thisMonth.reduce((sum, s) => sum + sessionDurationMinutes(s), 0), sessionCount: thisMonth.length }
}
