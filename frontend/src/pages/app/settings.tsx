import { Monitor, Moon, Settings, Sun } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { EmptyState } from '@/components/feedback/empty-state'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { Label, Small } from '@/components/typography'
import { useTheme } from '@/app/theme/theme-provider'
import type { ThemePreference } from '@/app/theme/theme-provider'
import { DeveloperToolsSection } from './developer-tools-section'

const APPEARANCE_OPTIONS = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
]

export function SettingsPage() {
  const { preference, setPreference } = useTheme()

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your workspace preferences." />

      <div className="flex flex-col gap-2.5 border-b border-border-subtle pb-8">
        <Label as="span">Appearance</Label>
        <Small className="text-muted-foreground">Choose how Recall looks on this device. System follows your OS setting.</Small>
        <SegmentedControl
          aria-label="Appearance"
          value={preference}
          onChange={(value) => setPreference(value as ThemePreference)}
          options={APPEARANCE_OPTIONS}
          className="mt-1.5 w-fit"
        />
      </div>

      {import.meta.env.DEV && <DeveloperToolsSection />}

      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={<Settings />}
          title="Nothing else configured yet"
          description="Workspace, notification, and account settings will live here."
        />
      </div>
    </PageContainer>
  )
}
