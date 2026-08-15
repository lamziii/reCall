import { useCallback, useEffect, useState } from 'react'
import { getTasksListData, setTaskStatus } from './tasks-service'
import type { TasksListData } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'
import { isLiveMode } from '@/data/live/data-mode'
import { useWorkspace } from '@/data/live/workspace-context'
import { subscribeSessions, subscribeTasks, updateTaskStatus } from '@/data/live/live-store'
import { statusViewToDb, toTasksListData } from '@/data/live/mappers'
import type { LiveSessionDoc, LiveTaskDoc } from '@/data/live/types'

export type TasksListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: TasksListData }

/**
 * Task board data. One hook, two backends: live Firestore (authenticated) or the localStorage
 * sample data (demo mode). All React hooks run unconditionally; only the effect body branches
 * on the stable `isLiveMode` constant.
 */
export function useTasksListData() {
  const { workspaceId } = useWorkspace()
  const [state, setState] = useState<TasksListState>({ status: 'loading' })
  const [tasks, setTasks] = useState<LiveTaskDoc[]>([])
  const [sessions, setSessions] = useState<LiveSessionDoc[]>([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isLiveMode) {
      setState({ status: 'loading' })
      try {
        const data = getTasksListData()
        const id = window.setTimeout(() => setState(data ? { status: 'success', data } : { status: 'empty' }), 250)
        return () => window.clearTimeout(id)
      } catch {
        setState({ status: 'error' })
        return
      }
    }
    const unsubTasks = subscribeTasks(workspaceId, setTasks, () => setState({ status: 'error' }))
    const unsubSessions = subscribeSessions(workspaceId, setSessions, () => {})
    return () => {
      unsubTasks()
      unsubSessions()
    }
  }, [workspaceId, attempt])

  // Live: recompute the view model whenever the task/session snapshots change.
  useEffect(() => {
    if (!isLiveMode) return
    setState((prev) => {
      if (prev.status === 'error') return prev
      if (tasks.length === 0) return { status: 'empty' }
      const titles = new Map(sessions.map((s) => [s.id, s.title]))
      return { status: 'success', data: toTasksListData(tasks, titles) }
    })
  }, [tasks, sessions])

  const refetch = useCallback(() => setAttempt((a) => a + 1), [])

  const changeTaskStatus = useCallback((taskId: string, status: TaskStatusValue) => {
    if (isLiveMode) {
      void updateTaskStatus(taskId, statusViewToDb(status)) // onSnapshot reflects the change
      return
    }
    setTaskStatus(taskId, status)
    const data = getTasksListData()
    if (data) setState({ status: 'success', data })
  }, [])

  return { state, refetch, changeTaskStatus }
}
