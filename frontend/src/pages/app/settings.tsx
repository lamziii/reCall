import { useState } from 'react'
import { Database, Monitor, Moon, Sun, PlayCircle, RotateCcw } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { Tabs, TabList, Tab, TabPanel } from '@/components/navigation/tabs'
import { Label, Small } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/feedback'
import { useTheme } from '@/app/theme/theme-provider'
import type { ThemePreference } from '@/app/theme/theme-provider'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { useWorkspacePlan } from '@/data/live/use-workspace-plan'
import { isLiveMode } from '@/data/live/data-mode'
import { resetTutorial } from '@/data/live/onboarding'
import { useTutorial } from '@/lib/onboarding/use-tutorial'
import { getWorkspaceData, saveWorkspaceData } from '@/data/workspace-repository'
import { generateSampleWorkspace } from '@/data/sample/generate-sample-workspace'
import { clearLiveSampleData, seedLiveSampleData } from '@/data/live/sample-live-data'
import { PersonalInfoSection } from '@/components/settings/personal-info-section'
import { PlanSection } from '@/components/settings/plan-section'
import { PaymentsSection } from '@/components/settings/payments-section'
import { NotificationsSection } from '@/components/settings/notifications-section'

const APPEARANCE_OPTIONS = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
]

export function SettingsPage() {
  const { preference, setPreference } = useTheme()
  const plan = useWorkspacePlan()

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your account and workspace preferences." />

      <Tabs defaultValue="account">
        <TabList>
          <Tab value="account">Account</Tab>
          <Tab value="plan">Plan</Tab>
          <Tab value="payments">Payments</Tab>
          <Tab value="notifications">Notifications</Tab>
          <Tab value="appearance">Appearance</Tab>
        </TabList>

        <TabPanel value="account" className="pt-6">
          <PersonalInfoSection />
        </TabPanel>

        <TabPanel value="plan" className="pt-6">
          <PlanSection />
        </TabPanel>

        <TabPanel value="payments" className="pt-6">
          <PaymentsSection plan={plan} />
        </TabPanel>

        <TabPanel value="notifications" className="pt-6">
          <NotificationsSection />
        </TabPanel>

        <TabPanel value="appearance" className="pt-6">
          <div className="flex flex-col gap-2.5">
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
        </TabPanel>
      </Tabs>

      <HelpOnboardingSection />

      {/* Dev-only tooling — compiled out of production builds (import.meta.env.DEV is false there). */}
      {import.meta.env.DEV && <DeveloperSection />}
    </PageContainer>
  )
}

/**
 * Help & onboarding — replay the product tour anytime (does NOT overwrite completed/skipped state).
 * The dev-only "Reset onboarding" returns the tour to its first-run state so the auto-show flow can
 * be re-tested; it's compiled out of production builds.
 */
function HelpOnboardingSection() {
  const { replay } = useTutorial()
  const { toast } = useToast()
  const { user } = useAuth()
  const [resetting, setResetting] = useState(false)

  async function reset() {
    if (!user) return
    setResetting(true)
    try {
      await resetTutorial(user.id)
      toast({ title: 'Onboarding reset', description: 'Reload the app to see the tour run as a first-time user.' })
    } catch {
      toast({ title: "Couldn't reset onboarding", variant: 'danger' })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-2.5 border-t border-border-subtle pt-8">
      <div className="flex items-center gap-2">
        <PlayCircle className="size-4 text-muted-foreground" aria-hidden />
        <Label as="span">Help &amp; onboarding</Label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <Small className="text-foreground">Product tour</Small>
          <Small className="text-muted-foreground">Replay the Recall introduction.</Small>
        </div>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && isLiveMode && (
            <Button variant="ghost" size="md" leftIcon={<RotateCcw />} loading={resetting} onClick={() => void reset()}>
              Reset onboarding
            </Button>
          )}
          <Button variant="secondary" size="md" leftIcon={<PlayCircle />} onClick={replay}>
            Replay tutorial
          </Button>
        </div>
      </div>
    </div>
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
    <div className="mt-8 flex flex-col gap-2.5 border-t border-border-subtle pt-8">
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
