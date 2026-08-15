'use client'

// /app/settings (no section) → SettingsContent defaults to "appearance", matching the Vite index route.
import { SettingsContent } from '@/views/app/settings'

export default function Page() {
  return <SettingsContent />
}
