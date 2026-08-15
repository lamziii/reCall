import { useCallback, useEffect, useState } from 'react'
import { getProjectDetailData, setProjectDecisionStatus, setProjectTaskStatus } from './projects-service'
import type { ProjectDetailData } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'

export type ProjectDetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; data: ProjectDetailData }

export function useProjectDetailData(projectId: string | undefined) {
  const [state, setState] = useState<ProjectDetailState>({ status: 'loading' })

  const load = useCallback(() => {
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
    load()
  }, [load])

  const approveDecision = useCallback(
    (decisionId: string) => {
      if (!projectId) return
      const updated = setProjectDecisionStatus(projectId, decisionId, 'approved')
      if (updated) setState({ status: 'success', data: updated })
    },
    [projectId],
  )

  const rejectDecision = useCallback(
    (decisionId: string) => {
      if (!projectId) return
      const updated = setProjectDecisionStatus(projectId, decisionId, 'rejected')
      if (updated) setState({ status: 'success', data: updated })
    },
    [projectId],
  )

  const changeTaskStatus = useCallback(
    (taskId: string, status: TaskStatusValue) => {
      if (!projectId) return
      const updated = setProjectTaskStatus(projectId, taskId, status)
      if (updated) setState({ status: 'success', data: updated })
    },
    [projectId],
  )

  return { state, refetch: load, approveDecision, rejectDecision, changeTaskStatus }
}
