import { useCallback, useEffect, useState } from 'react'
import { getCalendarMonthData } from './calendar-service'
import type { CalendarMonthData } from './types'
import { isLiveMode } from '@/data/live/data-mode'
import { useWorkspace } from '@/data/live/workspace-context'
import { subscribeSessions, subscribeTasks } from '@/data/live/live-store'
import { toLiveCalendarData } from '@/data/live/dashboard-mappers'
import type { LiveSessionDoc, LiveTaskDoc } from '@/data/live/types'

export type CalendarDataState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: CalendarMonthData }

/**
 * Calendar data. Two backends: live Firestore (real sessions + dated tasks placed on the grid) or
 * the localStorage sample data (demo mode). All hooks run unconditionally; only the effect body
 * branches on the stable `isLiveMode` constant.
 */
export function useCalendarData(year: number, month: number) {
  const { workspaceId } = useWorkspace()
  const [state, setState] = useState<CalendarDataState>({ status: 'loading' })
  const [sessions, setSessions] = useState<LiveSessionDoc[]>([])
  const [tasks, setTasks] = useState<LiveTaskDoc[]>([])
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getCalendarMonthData(year, month)
      window.setTimeout(() => setState(data ? { status: 'success', data } : { status: 'empty' }), 200)
    } catch {
      setState({ status: 'error' })
    }
  }, [year, month])

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

  // Live: rebuild the month grid whenever the month, or the session/task snapshots, change.
  useEffect(() => {
    if (!isLiveMode) return
    setState((prev) => {
      if (prev.status === 'error') return prev
      if (sessions.length === 0 && tasks.length === 0) return { status: 'empty' }
      return { status: 'success', data: toLiveCalendarData(sessions, tasks, year, month) }
    })
  }, [sessions, tasks, year, month])

  const refetch = useCallback(() => (isLiveMode ? setAttempt((a) => a + 1) : load()), [load])
  return { state, refetch }
}
