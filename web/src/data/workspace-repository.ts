import type { WorkspaceData } from './types'
import { SAMPLE_DATA_VERSION } from './sample/generate-sample-workspace'

const STORAGE_KEY = 'recall:workspace-data'

/** ponytail: localStorage today, same read/write/clear shape a real API-backed repository would expose later. */
export function getWorkspaceData(): WorkspaceData | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as WorkspaceData
    // A sample workspace saved by an older SAMPLE_DATA_VERSION may be missing fields/wiring
    // features added since (e.g. review status, notifications) — treat it as absent so every
    // page falls back to its empty state instead of silently rendering a stale, half-shaped workspace.
    if (data.workspace._sample && data.workspace._sample.sampleDataVersion !== SAMPLE_DATA_VERSION) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
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

