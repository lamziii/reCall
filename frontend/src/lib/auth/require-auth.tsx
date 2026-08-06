import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth-context'
import { useUserProfile } from '@/data/live/use-user-profile'

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

/**
 * Gate for the /app tree: the user must be signed in AND have finished onboarding. An authenticated
 * user who hasn't completed onboarding is sent to /onboarding to resume. In demo mode onboarding is
 * bypassed (useUserProfile reports completed).
 *
 * No redirect loop: /app → /onboarding only when incomplete; /onboarding → /app only when complete.
 */
export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const { loading: profileLoading, onboardingCompleted } = useUserProfile()

  if (authLoading || (user && profileLoading)) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

/** Inverse gate for /login — sends signed-in users onward (to /onboarding if unfinished, else /app). */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { loading: profileLoading, onboardingCompleted } = useUserProfile()

  if (authLoading || (user && profileLoading)) return <AuthLoading />
  if (user) return <Navigate to={onboardingCompleted ? '/app' : '/onboarding'} replace />
  return <>{children}</>
}
