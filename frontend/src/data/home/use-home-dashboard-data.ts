import { useCallback, useEffect, useMemo, useState } from 'react'
import { getHomeDashboardData } from './home-dashboard-service'
import type { HomeDashboardData } from './types'
import { isLiveMode } from '@/data/live/data-mode'
import { useWorkspace } from '@/data/live/workspace-context'
import { useAuth } from '@/lib/auth/auth-context'
import { subscribeSessions, subscribeTasks } from '@/data/live/live-store'
import { toLiveHomeData } from '@/data/live/dashboard-mappers'
import type { LiveSessionDoc, LiveTaskDoc } from '@/data/live/types'

export type HomeDashboardState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: HomeDashboardData }

/**
 * One coordinated load for the whole Home page. Two backends: live Firestore (real sessions +
 * tasks aggregated into the dashboard) or the localStorage sample data (demo mode). All hooks run
 * unconditionally; only the effect body branches on the stable `isLiveMode` constant.
 */
export function useHomeDashboardData() {
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const [state, setState] = useState<HomeDashboardState>({ status: 'loading' })
  const [sessions, setSessions] = useState<LiveSessionDoc[]>([])
  const [tasks, setTasks] = useState<LiveTaskDoc[]>([])
  const [attempt, setAttempt] = useState(0)

  const userName = useMemo(() => user?.name || user?.email?.split('@')[0] || 'there', [user])

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getHomeDashboardData()
      window.setTimeout(() => setState(data ? { status: 'success', data } : { status: 'empty' }), 250)
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    if (!isLiveMode) {
      load()
      return
    }
    const unsubSessions = subscribeSessions(workspaceId, setSessions, () => setState({ status: 'error' }))
    const unsubTasks = subscribeTasks(workspaceId, setTasks, () => {})
    return () => {
      unsubSessions()
      unsubTasks()
    }
  }, [workspaceId, attempt, load])

  // Live: recompute the dashboard view model whenever the session/task snapshots change.
  useEffect(() => {
    if (!isLiveMode) return
    setState((prev) => {
      if (prev.status === 'error') return prev
      if (sessions.length === 0) return { status: 'empty' }
      return { status: 'success', data: toLiveHomeData(sessions, tasks, { userName, workspaceName: 'your workspace' }) }
    })
  }, [sessions, tasks, userName])

  const refetch = useCallback(() => (isLiveMode ? setAttempt((a) => a + 1) : load()), [load])
  return { state, refetch }
}
