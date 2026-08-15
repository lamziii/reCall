'use client'

// /app/settings/[section] → SettingsContent reads the section via useParams (router-compat).
import { SettingsContent } from '@/views/app/settings'

export default function Page() {
  return <SettingsContent />
}
