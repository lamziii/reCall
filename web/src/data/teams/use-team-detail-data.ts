import { useCallback, useEffect, useState } from 'react'
import { getTeamDetailData } from './teams-service'
import type { TeamDetailData } from './types'

export type TeamDetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'success'; data: TeamDetailData }

export function useTeamDetailData(teamId: string | undefined) {
  const [state, setState] = useState<TeamDetailState>({ status: 'loading' })

  const load = useCallback(() => {
    if (!teamId) {
      setState({ status: 'not-found' })
      return
    }
    setState({ status: 'loading' })
    try {
      const result = getTeamDetailData(teamId)
      window.setTimeout(() => {
        setState(result && result !== 'not-found' ? { status: 'success', data: result } : { status: 'not-found' })
      }, 200)
    } catch {
      setState({ status: 'error' })
    }
  }, [teamId])

  useEffect(() => {
    load()
  }, [load])

  return { state, refetch: load }
}
