import { useCallback, useEffect, useState } from 'react'
import { getSessionsListData } from './sessions-service'
import type { SessionsListData } from './types'

export type SessionsListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: SessionsListData }

export function useSessionsListData() {
  const [state, setState] = useState<SessionsListState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getSessionsListData()
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
