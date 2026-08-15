'use client'

/**
 * Global client provider stack — the Next equivalent of the Vite app's App.tsx tree, minus
 * <BrowserRouter> (the App Router replaces it). Order preserved from App.tsx:
 *   Theme → Auth → Preferences → Toast
 *
 * WorkspaceProvider is intentionally NOT here — it scopes only the authenticated /app subtree, so it
 * lives in app/app/layout.tsx (matching the Vite routing where it wrapped the /app element only).
 */
import { useEffect, type ReactNode } from 'react'
import { ThemeProvider } from '@/app/theme/theme-provider'
import { AuthProvider } from '@/lib/auth/auth-context'
import { RecallPreferencesProvider } from '@/settings/settings-context'
import { ToastProvider } from '@/components/feedback/toast'
import { logFirebaseDiagnostics } from '@/lib/firebase/diagnostics'

export function Providers({ children }: { children: ReactNode }) {
  // Dev-only: log the resolved Firebase/Functions integration (project, region, endpoints, auth
  // state) so a misconfiguration is obvious. Safe — never logs tokens/secrets. No-op in production.
  useEffect(() => {
    void logFirebaseDiagnostics()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <RecallPreferencesProvider>
          <ToastProvider>{children}</ToastProvider>
        </RecallPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
