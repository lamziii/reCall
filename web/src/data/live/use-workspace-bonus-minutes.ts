import { useEffect, useState } from 'react'
import { getWorkspaceData } from '@/data/workspace-repository'
import { isDemoMode, isLiveMode } from './data-mode'
import { useWorkspace } from './workspace-context'
import { subscribeWorkspace } from './live-store'

/**
 * Extra minutes purchased on top of the plan's included monthly hours. Live mode subscribes to
 * the workspace doc's `bonus_minutes` field; demo mode reads the localStorage sample workspace.
 */
export function useWorkspaceBonusMinutes(): number {
  const { workspaceId } = useWorkspace()
  const [bonusMinutes, setBonusMinutes] = useState(0)

  useEffect(() => {
    if (!isLiveMode) return
    return subscribeWorkspace(workspaceId, (ws) => setBonusMinutes(ws?.bonus_minutes ?? 0), () => {})
  }, [workspaceId])

  if (isDemoMode) return getWorkspaceData()?.workspace.bonusMinutes ?? 0
  return bonusMinutes
}
