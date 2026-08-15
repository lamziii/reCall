import { useCallback, useEffect, useState } from 'react'
import { getSessionDetailData, setDecisionStatus, setTaskStatus } from './sessions-service'
import type { SessionDetailData } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'

export type SessionDetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; data: SessionDetailData }

export function useSessionDetailData(sessionId: string | undefined) {
  const [state, setState] = useState<SessionDetailState>({ status: 'loading' })

  const load = useCallback(() => {
    if (!sessionId) {
      setState({ status: 'not-found' })
      return
    }
    setState({ status: 'loading' })
    try {
      const result = getSessionDetailData(sessionId)
      window.setTimeout(() => {
        setState(result && result !== 'not-found' ? { status: 'success', data: result } : { status: 'not-found' })
      }, 200)
    } catch {
      setState({ status: 'error' })
    }
  }, [sessionId])

  useEffect(() => {
    load()
  }, [load])

  const approveDecision = useCallback(
    (decisionId: string) => {
      if (!sessionId) return
      const updated = setDecisionStatus(sessionId, decisionId, 'approved')
      if (updated) setState({ status: 'success', data: updated })
    },
    [sessionId],
  )

  const rejectDecision = useCallback(
    (decisionId: string) => {
      if (!sessionId) return
      const updated = setDecisionStatus(sessionId, decisionId, 'rejected')
      if (updated) setState({ status: 'success', data: updated })
    },
    [sessionId],
  )

  const changeTaskStatus = useCallback(
    (taskId: string, status: TaskStatusValue) => {
      if (!sessionId) return
      const updated = setTaskStatus(sessionId, taskId, status)
      if (updated) setState({ status: 'success', data: updated })
    },
    [sessionId],
  )

  return { state, refetch: load, approveDecision, rejectDecision, changeTaskStatus }
}
