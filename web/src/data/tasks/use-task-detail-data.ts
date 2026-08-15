import { useCallback, useEffect, useState } from 'react'
import { getTaskDetailData, setTaskStatus } from './tasks-service'
import type { TaskDetailData } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'

export type TaskDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; data: TaskDetailData }

export function useTaskDetailData(taskId: string | null) {
  const [state, setState] = useState<TaskDetailState>({ status: 'idle' })

  const load = useCallback(() => {
    if (!taskId) {
      setState({ status: 'idle' })
      return
    }
    setState({ status: 'loading' })
    try {
      const result = getTaskDetailData(taskId)
      window.setTimeout(() => {
        setState(result && result !== 'not-found' ? { status: 'success', data: result } : { status: 'not-found' })
      }, 150)
    } catch {
      setState({ status: 'error' })
    }
  }, [taskId])

  useEffect(() => {
    load()
  }, [load])

  const changeStatus = useCallback(
    (status: TaskStatusValue) => {
      if (!taskId) return
      const updated = setTaskStatus(taskId, status)
      if (updated) setState({ status: 'success', data: updated })
    },
    [taskId],
  )

  return { state, changeStatus }
}
