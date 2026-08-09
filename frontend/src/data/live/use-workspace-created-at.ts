import { useEffect, useState } from 'react'
import { getWorkspaceData } from '@/data/workspace-repository'
import { isDemoMode, isLiveMode } from './data-mode'
import { useWorkspace } from './workspace-context'
import { subscribeWorkspace } from './live-store'

/**
 * When the workspace was created — anchors the 7-day free trial countdown (see data/plans.ts
 * TRIAL_DAYS). Live mode subscribes to the workspace doc's `created_at` server timestamp; demo
 * mode reads the localStorage sample workspace. Null while unresolved or on workspaces created
 * before this field existed (trial state can't be determined, so callers should hide the UI).
 */
export function useWorkspaceCreatedAt(): Date | null {
  const { workspaceId } = useWorkspace()
  const [createdAt, setCreatedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!isLiveMode) return
    return subscribeWorkspace(workspaceId, (ws) => setCreatedAt(ws?.created_at?.toDate() ?? null), () => {})
  }, [workspaceId])

  if (isDemoMode) {
    const raw = getWorkspaceData()?.workspace.createdAt
    return raw ? new Date(raw) : null
  }
  return createdAt
}
