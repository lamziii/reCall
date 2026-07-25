import type { WorkspaceData } from './types'

const STORAGE_KEY = 'recall:workspace-data'

/** ponytail: localStorage today, same read/write/clear shape a real API-backed repository would expose later. */
export function getWorkspaceData(): WorkspaceData | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WorkspaceData
  } catch {
    return null
  }
}

export function saveWorkspaceData(data: WorkspaceData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function deleteWorkspaceData(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function hasSampleData(): boolean {
  const data = getWorkspaceData()
  return Boolean(data?.workspace._sample)
}

/**
 * Removes only records tagged with `_sample` (see SampleMeta in ./types), leaving any
 * real, user-created records untouched. Returns the resulting data, or null if nothing
 * real remains — callers should treat null the same as "no workspace data".
 */
export function clearSampleRecords(): WorkspaceData | null {
  const data = getWorkspaceData()
  if (!data) return null

  if (data.workspace._sample) {
    deleteWorkspaceData()
    return null
  }

  // The workspace itself is real; only strip sample-tagged rows out of each collection.
  const cleaned: WorkspaceData = {
    workspace: data.workspace,
    people: data.people.filter((r) => !r._sample),
    projects: data.projects.filter((r) => !r._sample),
    sessions: data.sessions.filter((r) => !r._sample),
    tasks: data.tasks.filter((r) => !r._sample),
    decisions: data.decisions.filter((r) => !r._sample),
    questions: data.questions.filter((r) => !r._sample),
    risks: data.risks.filter((r) => !r._sample),
    activity: data.activity.filter((r) => !r._sample),
  }
  saveWorkspaceData(cleaned)
  return cleaned
}
