'use client'

/**
 * Settings shell layout. SettingsPage renders the stable header + section nav (SettingsShell) with an
 * <Outlet/> for the active section; the section page arrives as `children`, bridged via OutletProvider.
 * Matches the Vite nested route: <Route path="settings" element={<SettingsPage/>}> with child sections.
 */
import { SettingsPage } from '@/views/app/settings'
import { OutletProvider } from '@/lib/router-compat'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OutletProvider value={children}>
      <SettingsPage />
    </OutletProvider>
  )
}
