import { useEffect, useState } from 'react'
import { DEFAULT_PLAN, type PlanTier } from '@/data/plans'
import { getWorkspaceData } from '@/data/workspace-repository'
import { isDemoMode, isLiveMode } from './data-mode'
import { useWorkspace } from './workspace-context'
import { subscribeWorkspace } from './live-store'

/**
 * The workspace's subscription plan. Live mode subscribes to the workspace doc; demo mode reads the
 * localStorage sample workspace. Falls back to DEFAULT_PLAN until resolved (matches the default new
 * workspaces are created with — see workspace-bootstrap.ts).
 */
export function useWorkspacePlan(): PlanTier {
  const { workspaceId } = useWorkspace()
  const [plan, setPlan] = useState<PlanTier | null>(null)

  useEffect(() => {
    if (!isLiveMode) return
    return subscribeWorkspace(workspaceId, (ws) => setPlan(ws?.plan ?? null), () => {})
  }, [workspaceId])

  if (isDemoMode) return getWorkspaceData()?.workspace.plan ?? DEFAULT_PLAN
  return plan ?? DEFAULT_PLAN
}
