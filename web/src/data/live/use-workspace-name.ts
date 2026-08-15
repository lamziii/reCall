import { useEffect, useState } from 'react'
import { isLiveMode } from './data-mode'
import { useWorkspace } from './workspace-context'
import { subscribeWorkspace } from './live-store'
import { useAuth } from '@/lib/auth/auth-context'

/**
 * The real workspace name for the shell. Live mode subscribes to the workspace doc; until it
 * resolves (or in demo mode) it falls back to a name derived from the signed-in user — never a
 * hardcoded placeholder.
 */
export function useWorkspaceName(): string {
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    if (!isLiveMode) return
    return subscribeWorkspace(workspaceId, (ws) => setName(ws?.name ?? null), () => {})
  }, [workspaceId])

  const firstName = user?.name?.trim().split(/\s+/)[0]
  return name || (firstName ? `${firstName}'s Workspace` : 'My Workspace')
}
