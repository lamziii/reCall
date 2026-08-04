import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
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
