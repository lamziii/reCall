import { useCallback, useEffect, useState } from 'react'
import { getProjectsListData } from './projects-service'
import type { ProjectsListData } from './types'

export type ProjectsListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: ProjectsListData }

export function useProjectsListData() {
  const [state, setState] = useState<ProjectsListState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getProjectsListData()
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

  return { state, refetch: load }
}
