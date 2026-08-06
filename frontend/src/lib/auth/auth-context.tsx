import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  refreshAuthUser,
  signInWithGoogle as svcSignInWithGoogle,
  signOutUser,
  subscribeToAuth,
  type AuthUser,
} from './auth-service'

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  /** Re-reads the current user after an in-app profile edit (e.g. Settings → personal info) so
   *  `user` reflects it immediately. `demoPatch` is only applied in demo mode (no persisted identity). */
  refreshUser: (demoPatch?: Partial<AuthUser>) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuth((next) => {
      setUser(next)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signInWithGoogle: async () => {
        await svcSignInWithGoogle()
      },
      signOut: signOutUser,
      refreshUser: async (demoPatch) => {
        const next = await refreshAuthUser(demoPatch)
        if (next) setUser(next)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>.')
  return ctx
}
