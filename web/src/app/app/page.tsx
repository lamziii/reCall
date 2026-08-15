'use client'

/**
 * /app index — the Vite app's LandingGate. Honors the user's configurable default landing page
 * (Settings → Workspace): if it isn't "home", redirect there; otherwise render the Home dashboard.
 * Only mounts at the /app index, so it never hijacks a deep link (those resolve to their own routes).
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecallPreferences } from '@/settings/settings-context'
import { AppHomePage } from '@/views/app/home'

export default function AppIndexPage() {
  const { preferences } = useRecallPreferences()
  const router = useRouter()
  const landing = preferences.workspace.landingPage
  const redirecting = Boolean(landing && landing !== 'home')

  useEffect(() => {
    if (redirecting) router.replace(`/app/${landing}`)
  }, [redirecting, landing, router])

  if (redirecting) return null
  return <AppHomePage />
}
