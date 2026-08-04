import { useCallback, useEffect, useState } from 'react'
import { getSessionsListData } from './sessions-service'
import type { SessionsListData } from './types'
import { isLiveMode } from '@/data/live/data-mode'
import { useWorkspace } from '@/data/live/workspace-context'
import { subscribeSessions } from '@/data/live/live-store'
import { toSessionsListData } from '@/data/live/mappers'

export type SessionsListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: SessionsListData }

/**
 * Sessions list data. One hook, two backends: live Firestore or the localStorage sample data.
 * All React hooks run unconditionally; only the effect body branches on `isLiveMode`.
 */
export function useSessionsListData() {
  const { workspaceId } = useWorkspace()
  const [state, setState] = useState<SessionsListState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isLiveMode) {
      setState({ status: 'loading' })
      try {
        const data = getSessionsListData()
        const id = window.setTimeout(() => setState(data ? { status: 'success', data } : { status: 'empty' }), 250)
        return () => window.clearTimeout(id)
      } catch {
        setState({ status: 'error' })
        return
      }
    }
    return subscribeSessions(
      workspaceId,
      (sessions) =>
        setState(sessions.length === 0 ? { status: 'empty' } : { status: 'success', data: toSessionsListData(sessions) }),
      () => setState({ status: 'error' }),
    )
  }, [workspaceId, attempt])

  const refetch = useCallback(() => setAttempt((a) => a + 1), [])
  return { state, refetch }
}
