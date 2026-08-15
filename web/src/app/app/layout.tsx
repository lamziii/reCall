'use client'

/**
 * Authenticated app shell — the App Router home for the Vite app's routing of the /app subtree.
 * Mirrors routes/index.tsx exactly: RequireAuth → RequireOnboarded → WorkspaceProvider → RecallShell.
 *
 * RecallShell renders <Outlet/> where the child route's page goes; in App Router that page arrives as
 * `children`, so OutletProvider bridges the two (see @/lib/router-compat). This is the single client
 * boundary for the whole app surface — every /app page is interactive (realtime, command palette,
 * recording), so a client shell here is correct, not a workaround.
 */
import { RequireAuth, RequireOnboarded } from '@/lib/auth/require-auth'
import { WorkspaceProvider } from '@/data/live/workspace-context'
import { ActiveSessionProvider } from '@/data/active-session/active-session-context'
import { PipCompanionProvider } from '@/data/active-session/pip-companion'
import { RecordingDock } from '@/components/recording/recording-dock'
import { RecallShell } from '@/app/shell/recall-shell'
import { OutletProvider } from '@/lib/router-compat'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RequireOnboarded>
        <WorkspaceProvider>
          {/* ActiveSessionProvider lives here — above the routed pages — so a recording survives
              navigation between /app/* routes. PipCompanionProvider renders the Meeting Companion into
              a Document PiP window as another consumer of the SAME session. RecordingDock is the
              persistent global surface / PiP fallback. */}
          <ActiveSessionProvider>
            <PipCompanionProvider>
              <OutletProvider value={children}>
                <RecallShell />
              </OutletProvider>
              <RecordingDock />
            </PipCompanionProvider>
          </ActiveSessionProvider>
        </WorkspaceProvider>
      </RequireOnboarded>
    </RequireAuth>
  )
}
