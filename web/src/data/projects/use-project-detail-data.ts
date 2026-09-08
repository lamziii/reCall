import { useCallback, useEffect, useState } from 'react'
import { getProjectDetailData, setProjectDecisionStatus, setProjectTaskStatus } from './projects-service'
import type { ProjectDetailData } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'
import { isLiveMode } from '@/data/live/data-mode'
import { useWorkspace } from '@/data/live/workspace-context'
import { useAuth } from '@/lib/auth/auth-context'
import { getProject } from '@/data/live/projects-store'
import { subscribeSessions, subscribeTasks, updateTaskStatus } from '@/data/live/live-store'
import { statusViewToDb } from '@/data/live/mappers'
import type { LiveProjectDoc, LiveSessionDoc, LiveTaskDoc } from '@/data/live/types'
import { liveProjectToDetail } from './live-projects-map'

export type ProjectDetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; data: ProjectDetailData }

export function useProjectDetailData(projectId: string | undefined) {
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const [state, setState] = useState<ProjectDetailState>({ status: 'loading' })

  const loadDemo = useCallback(() => {
    if (!projectId) {
      setState({ status: 'not-found' })
      return
    }
    setState({ status: 'loading' })
    try {
      const result = getProjectDetailData(projectId)
      window.setTimeout(() => {
        setState(result && result !== 'not-found' ? { status: 'success', data: result } : { status: 'not-found' })
      }, 200)
    } catch {
      setState({ status: 'error' })
    }
  }, [projectId])

  useEffect(() => {
    if (!isLiveMode) {
      loadDemo()
      return
    }
    if (!projectId) {
      setState({ status: 'not-found' })
      return
    }
    setState({ status: 'loading' })
    let project: LiveProjectDoc | null = null
    let projectResolved = false
    let sessions: LiveSessionDoc[] = []
    let tasks: LiveTaskDoc[] = []
    const recompute = () => {
      if (!projectResolved) return
      if (!project) { setState({ status: 'not-found' }); return }
      setState({ status: 'success', data: liveProjectToDetail(project, sessions, tasks, user?.id) })
    }
    getProject(projectId)
      .then((p) => { project = p; projectResolved = true; recompute() })
      .catch(() => setState({ status: 'error' }))
    const unsubS = subscribeSessions(workspaceId, (s) => { sessions = s; recompute() }, () => {})
    const unsubT = subscribeTasks(workspaceId, (t) => { tasks = t; recompute() }, () => {})
    return () => { unsubS(); unsubT() }
  }, [projectId, workspaceId, user?.id, loadDemo])

  const approveDecision = useCallback(
    (decisionId: string) => {
      if (isLiveMode || !projectId) return
      const updated = setProjectDecisionStatus(projectId, decisionId, 'approved')
      if (updated) setState({ status: 'success', data: updated })
    },
    [projectId],
  )

  const rejectDecision = useCallback(
    (decisionId: string) => {
      if (isLiveMode || !projectId) return
      const updated = setProjectDecisionStatus(projectId, decisionId, 'rejected')
      if (updated) setState({ status: 'success', data: updated })
    },
    [projectId],
  )

  const changeTaskStatus = useCallback(
    (taskId: string, status: TaskStatusValue) => {
      if (isLiveMode) {
        void updateTaskStatus(taskId, statusViewToDb(status)) // live subscription re-renders the tab
        return
      }
      if (!projectId) return
      const updated = setProjectTaskStatus(projectId, taskId, status)
      if (updated) setState({ status: 'success', data: updated })
    },
    [projectId],
  )

  return { state, refetch: loadDemo, approveDecision, rejectDecision, changeTaskStatus }
}
