import { Monitor, Moon, Sun } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { Label, Small, Body, Caption } from '@/components/typography'
import { Avatar } from '@/components/data-display/avatar'
import { useTheme } from '@/app/theme/theme-provider'
import type { ThemePreference } from '@/app/theme/theme-provider'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspaceName } from '@/data/live/use-workspace-name'

const APPEARANCE_OPTIONS = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
]

export function SettingsPage() {
  const { preference, setPreference } = useTheme()
  const { user } = useAuth()
  const workspaceName = useWorkspaceName()

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your account and workspace preferences." />

      <div className="flex flex-col gap-3 border-b border-border-subtle pb-8">
        <Label as="span">Account</Label>
        <div className="mt-1 flex items-center gap-3">
          <Avatar name={user?.name ?? 'Recall User'} src={user?.photoURL} size="lg" />
          <div className="flex min-w-0 flex-col">
            <Body className="font-medium text-foreground">{user?.name ?? 'Recall User'}</Body>
            <Caption className="text-subtle-foreground">{user?.email ?? '—'}</Caption>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-b border-border-subtle pb-8">
        <Label as="span">Workspace</Label>
        <Small className="text-muted-foreground">You're the owner of this workspace.</Small>
        <Body className="mt-1 font-medium text-foreground">{workspaceName}</Body>
      </div>

      <div className="flex flex-col gap-2.5 pb-8">
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
    </PageContainer>
  )
}
