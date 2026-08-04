import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth-context'

/** Full-screen loading while auth state resolves. Dark to match the pre-auth surfaces. */
function AuthLoading() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg" data-theme="dark">
      <div className="size-6 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" aria-label="Loading" />
    </div>
  )
}

/** Gate for the authenticated /app tree — redirects to /login when signed out. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

/** Inverse gate for /login and /onboarding — sends already-signed-in users to the app. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (user) return <Navigate to="/app" replace />
  return <>{children}</>
}
