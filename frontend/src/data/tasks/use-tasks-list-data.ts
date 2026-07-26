import { useCallback, useEffect, useState } from 'react'
import { getTasksListData, setTaskStatus } from './tasks-service'
import type { TasksListData } from './types'
import type { TaskStatusValue } from '@/components/recall/task-status'

export type TasksListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: TasksListData }

export function useTasksListData() {
  const [state, setState] = useState<TasksListState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getTasksListData()
      window.setTimeout(() => {
        setState(data ? { status: 'success', data } : { status: 'empty' })
      }, 250)
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const changeTaskStatus = useCallback(
    (taskId: string, status: TaskStatusValue) => {
      setTaskStatus(taskId, status)
      const data = getTasksListData()
      if (data) setState({ status: 'success', data })
    },
    [],
  )

  return { state, refetch: load, changeTaskStatus }
}
