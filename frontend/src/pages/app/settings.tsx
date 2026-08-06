import { useState } from 'react'
import { Database, Monitor, Moon, Sun } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { Label, Small, Body, Caption } from '@/components/typography'
import { Avatar } from '@/components/data-display/avatar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/feedback'
import { useTheme } from '@/app/theme/theme-provider'
import type { ThemePreference } from '@/app/theme/theme-provider'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { useWorkspaceName } from '@/data/live/use-workspace-name'
import { isLiveMode } from '@/data/live/data-mode'
import { getWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { clearLiveSampleData, seedLiveSampleData } from '@/data/live/sample-live-data'

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

      {/* Dev-only tooling — compiled out of production builds (import.meta.env.DEV is false there). */}
      {import.meta.env.DEV && <DeveloperSection />}
    </PageContainer>
  )
}

/**
 * Developer utilities, shown ONLY in dev builds and ONLY here in Settings. "Generate dummy data"
 * reuses the existing sample-workspace generator + localStorage repository (no second
 * implementation) to seed the full sample dataset.
 *
 * In LIVE mode it writes real, `sample`-flagged sessions + tasks to the current Firestore workspace
 * (seedLiveSampleData) so the Home dashboard, Sessions, Calendar and Tasks board render populated
 * instead of their empty state. In DEMO mode it seeds the localStorage sample workspace. Either way
 * it reuses existing generators — no second implementation — and never touches real user sessions.
 */
function DeveloperSection() {
  const { toast } = useToast()
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function seed() {
    setSeeding(true)
    try {
      if (isLiveMode) {
        await seedLiveSampleData(workspaceId, user?.id ?? 'sample')
        toast({ title: 'Sample sessions & tasks added', description: 'Open Home, Sessions or Calendar to see them.', variant: 'success' })
      } else {
        saveWorkspaceData(generateSampleWorkspace(`dev-${Date.now()}`))
        toast({ title: 'Sample data generated', description: 'Open Projects, People, Teams, Reviews or Notifications to see it.', variant: 'success' })
      }
    } catch {
      toast({ title: "Couldn't generate sample data", description: isLiveMode ? 'Check your connection and Firestore rules.' : undefined, variant: 'danger' })
    } finally {
      setSeeding(false)
      setConfirmOpen(false)
    }
  }

  async function clearSample() {
    setClearing(true)
    try {
      await clearLiveSampleData(workspaceId)
      toast({ title: 'Sample data cleared' })
    } catch {
      toast({ title: "Couldn't clear sample data", variant: 'danger' })
    } finally {
      setClearing(false)
    }
  }

  function handleClick() {
    // Live seed is non-destructive to real data (only sample-flagged docs), so it's safe to re-run;
    // demo seed overwrites the single localStorage workspace, so confirm when one already exists.
    if (!isLiveMode && getWorkspaceData()) {
      setConfirmOpen(true)
    } else {
      void seed()
    }
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-8">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" aria-hidden />
        <Label as="span">Developer</Label>
      </div>
      <Small className="text-muted-foreground">
        {isLiveMode
          ? 'Add a set of sample sessions and tasks to this workspace so the dashboard looks populated. They are flagged as sample data and never touch your real sessions.'
          : 'Seed this browser with the full sample workspace (sessions, tasks, projects, people, teams, reviews, notifications).'}{' '}
        Only visible in development builds.
      </Small>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button variant="secondary" className="w-fit" loading={seeding} onClick={handleClick}>
          Generate dummy data
        </Button>
        {isLiveMode && (
          <Button variant="ghost" className="w-fit" loading={clearing} onClick={clearSample}>
            Clear sample data
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Replace existing sample data?"
        description="This browser already has sample data. Generating again overwrites it with a fresh set."
        confirmLabel="Overwrite"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void seed()}
      />
    </div>
  )
}
