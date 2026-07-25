import { useCallback, useEffect, useState } from 'react'
import { getHomeDashboardData } from './home-dashboard-service'
import type { HomeDashboardData } from './types'

export type HomeDashboardState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: HomeDashboardData }

/** One coordinated load for the whole Home page — no per-section fetching. */
export function useHomeDashboardData() {
  const [state, setState] = useState<HomeDashboardState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      // Simulated latency so the skeleton is reachable/visible — this is a synchronous
      // localStorage read today, a real fetch once a backend exists.
      const data = getHomeDashboardData()
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
