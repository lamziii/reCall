import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'
import { useAuth } from '@/lib/auth/auth-context'
import { isDemoMode } from './data-mode'
import type { UserProfile } from './onboarding'

export interface UserProfileState {
  profile: UserProfile | null
  loading: boolean
  /** True once we know the user has finished onboarding (or demo mode, which bypasses it). */
  onboardingCompleted: boolean
}

/**
 * Live subscription to the signed-in user's `users/{uid}` profile — the gate for onboarding
 * routing. In demo mode there is no Firebase, so onboarding is treated as complete.
 *
 * A DENIED/missing read resolves as `profile: null` (not an error): a brand-new user has no profile
 * yet, which reads as "not onboarded". We never block on it.
 */
export function useUserProfile(): UserProfileState {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(!isDemoMode)

  useEffect(() => {
    if (isDemoMode || !user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      doc(getDb(), 'users', user.id),
      (snap) => {
        setProfile(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null)
        setLoading(false)
      },
      () => {
        setProfile(null)
        setLoading(false)
      },
    )
    return unsub
  }, [user])

  const onboardingCompleted = isDemoMode ? true : profile?.onboarding_completed === true
  return { profile, loading, onboardingCompleted }
}
