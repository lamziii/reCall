import { useEffect, useState } from 'react'
import { isLiveMode } from './data-mode'
import { useWorkspace } from './workspace-context'
import { subscribeSessions, subscribeTasks } from './live-store'
import { APP_BASE } from '@/app/shell/nav-config'
import type { LiveSessionDoc, LiveTaskDoc } from './types'

export type SearchEntryType = 'session' | 'task' | 'project'

export interface SearchEntry {
  id: string
  type: SearchEntryType
  title: string
  /** Secondary line — participants, owner/status, etc. Also matched by the query. */
  subtitle?: string
  /** In-app route to open on select. */
  to: string
}

const TASK_STATUS_LABEL: Record<string, string> = { todo: 'To do', in_progress: 'In progress', done: 'Done' }

/**
 * A flat, searchable index of the workspace's content — sessions, tasks, and the projects derived
 * from them — for the global ⌘K palette. Live mode subscribes to the same sessions/tasks streams
 * the pages use; demo/no-auth returns an empty index (the palette still offers navigation and AI).
 * Kept intentionally simple: substring matching over title + subtitle, no server round-trip.
 */
export function useSearchIndex(): SearchEntry[] {
  const { workspaceId } = useWorkspace()
  const [sessions, setSessions] = useState<LiveSessionDoc[]>([])
  const [tasks, setTasks] = useState<LiveTaskDoc[]>([])

  useEffect(() => {
    if (!isLiveMode) return
    const unsubS = subscribeSessions(workspaceId, setSessions, () => setSessions([]))
    const unsubT = subscribeTasks(workspaceId, setTasks, () => setTasks([]))
    return () => {
      unsubS()
      unsubT()
    }
  }, [workspaceId])

  if (!isLiveMode) return []

  const entries: SearchEntry[] = []
  const projects = new Map<string, string>()

  for (const s of sessions) {
    entries.push({
      id: `session-${s.id}`,
      type: 'session',
      title: s.title || 'Untitled session',
      subtitle: [s.participants?.length ? s.participants.slice(0, 4).join(', ') : null, s.review_summary || null]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 120),
      to: `${APP_BASE}/sessions/${s.id}`,
    })
    if (s.project_id && s.project_name) projects.set(s.project_id, s.project_name)
  }

  for (const t of tasks) {
    entries.push({
      id: `task-${t.id}`,
      type: 'task',
      title: t.title || 'Untitled task',
      subtitle: [t.owner || 'Unassigned', t.status ? TASK_STATUS_LABEL[t.status] ?? t.status : null, t.source_session_title ? `from ${t.source_session_title}` : null]
        .filter(Boolean)
        .join(' · '),
      to: `${APP_BASE}/tasks`,
    })
    if (t.project_id && !projects.has(t.project_id)) projects.set(t.project_id, '')
  }

  for (const [id, name] of projects) {
    if (!name) continue // only surface projects we have a display name for (working link + label)
    entries.push({ id: `project-${id}`, type: 'project', title: name, subtitle: 'Project', to: `${APP_BASE}/projects/${id}` })
  }

  return entries
}
