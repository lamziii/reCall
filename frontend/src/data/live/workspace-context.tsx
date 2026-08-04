import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { isDemoMode } from './data-mode'
import { bootstrapWorkspace } from './workspace-bootstrap'
import { Button } from '@/components/ui/button'

interface WorkspaceContextValue {
  workspaceId: string
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

function BootstrapLoading() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-bg text-center">
      <div className="size-6 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" aria-hidden />
      <p className="text-small text-muted-foreground">Setting up your workspace…</p>
    </div>
  )
}

function BootstrapError({ onRetry, onSignOut }: { onRetry: () => void; onSignOut: () => void }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <AlertTriangle className="size-6 text-danger" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-title font-medium text-foreground">We couldn't open your workspace</p>
        <p className="text-small text-muted-foreground">Check your connection and try again, or sign out to switch accounts.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="ghost" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

/**
 * Resolves and provides the active workspace id for the authenticated user. Mount inside
 * RequireAuth so `user` is always present. In demo mode this is a no-op with a fixed id.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const [workspaceId, setWorkspaceId] = useState<string | null>(isDemoMode ? 'demo-workspace' : null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(isDemoMode ? 'ready' : 'loading')
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  useEffect(() => {
    if (isDemoMode || !user) return
    let cancelled = false
    setStatus('loading')
    bootstrapWorkspace(user)
      .then((id) => {
        if (cancelled) return
        setWorkspaceId(id)
        setStatus('ready')
      })
      .catch((err) => {
        console.error('bootstrapWorkspace failed:', err)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [user, attempt])

  if (status === 'loading') return <BootstrapLoading />
  if (status === 'error' || !workspaceId) return <BootstrapError onRetry={retry} onSignOut={() => void signOut()} />

  return <WorkspaceContext.Provider value={{ workspaceId }}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (ctx) return ctx
  // In demo mode there is no provider (and no Firebase). Return a stable placeholder so hooks
  // that call useWorkspace() unconditionally still work; live effects are gated on isLiveMode.
  if (isDemoMode) return { workspaceId: 'demo-workspace' }
  throw new Error('useWorkspace must be used within a <WorkspaceProvider>.')
}
