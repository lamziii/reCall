import { useCallback, useEffect, useState } from 'react'
import { getTeamsListData } from './teams-service'
import type { TeamsListData } from './types'

export type TeamsListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: TeamsListData }

export function useTeamsListData() {
  const [state, setState] = useState<TeamsListState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getTeamsListData()
      window.setTimeout(() => {
        setState(data && data.teams.length > 0 ? { status: 'success', data } : { status: 'empty' })
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
