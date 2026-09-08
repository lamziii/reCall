import { useCallback, useEffect, useState } from 'react'
import { getProjectsListData } from './projects-service'
import type { ProjectsListData } from './types'
import { isLiveMode } from '@/data/live/data-mode'
import { useWorkspace } from '@/data/live/workspace-context'
import { useAuth } from '@/lib/auth/auth-context'
import { subscribeProjects } from '@/data/live/projects-store'
import { subscribeSessions, subscribeTasks } from '@/data/live/live-store'
import type { LiveProjectDoc, LiveSessionDoc, LiveTaskDoc } from '@/data/live/types'
import { liveProjectToListItem } from './live-projects-map'

export type ProjectsListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: ProjectsListData }

export function useProjectsListData() {
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const [state, setState] = useState<ProjectsListState>({ status: 'loading' })
  const [nonce, setNonce] = useState(0)
  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  // DEMO: read the sample workspace once (with the tiny artificial delay the UI expects).
  const loadDemo = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getProjectsListData()
      window.setTimeout(() => setState(data ? { status: 'success', data } : { status: 'empty' }), 250)
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    if (!isLiveMode) {
      loadDemo()
      return
    }
    // LIVE: projects + sessions + tasks streams; recompute counts/progress from related entities.
    setState({ status: 'loading' })
    let projects: LiveProjectDoc[] = []
    let sessions: LiveSessionDoc[] = []
    let tasks: LiveTaskDoc[] = []
    let projectsReady = false
    const recompute = () => {
      if (!projectsReady) return
      const items = projects
        .map((p) => liveProjectToListItem(p, sessions, tasks, user?.id))
        .sort((a, b) => new Date(b.updatedRaw).getTime() - new Date(a.updatedRaw).getTime())
      setState(items.length ? { status: 'success', data: { projects: items, ownerOptions: [] } } : { status: 'empty' })
    }
    const unsubP = subscribeProjects(workspaceId, (p) => { projects = p; projectsReady = true; recompute() }, () => setState({ status: 'error' }))
    const unsubS = subscribeSessions(workspaceId, (s) => { sessions = s; recompute() }, () => {})
    const unsubT = subscribeTasks(workspaceId, (t) => { tasks = t; recompute() }, () => {})
    return () => { unsubP(); unsubS(); unsubT() }
  }, [workspaceId, user?.id, loadDemo, nonce])

  return { state, refetch }
}
