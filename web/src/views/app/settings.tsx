import { useState } from 'react'
import { useParams } from '@/lib/router-compat'
import { Database, PlayCircle, RotateCcw } from 'lucide-react'
import { Label, Small } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/feedback'
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
import { SettingsShell, type SettingsNavGroup } from '@/components/settings/settings-shell'
import { AppearanceSection } from '@/components/settings/sections/appearance-section'
import { WorkspaceSection } from '@/components/settings/sections/workspace-section'
import { NotesSection } from '@/components/settings/sections/notes-section'
import { ProductivitySection } from '@/components/settings/sections/productivity-section'
import { AiSection } from '@/components/settings/sections/ai-section'
import { AccessibilitySection } from '@/components/settings/sections/accessibility-section'
import { PersonalizationSection } from '@/components/settings/sections/personalization-section'
import { ExperimentalSection } from '@/components/settings/sections/experimental-section'
import { AdvancedSection } from '@/components/settings/sections/advanced-section'

const NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: 'Account',
    items: [
      { key: 'account', label: 'Account' },
      { key: 'plan', label: 'Plan' },
      { key: 'payments', label: 'Payments' },
      { key: 'notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Customization',
    items: [
      { key: 'appearance', label: 'Appearance' },
      { key: 'workspace', label: 'Workspace' },
      { key: 'notes', label: 'Notes' },
      { key: 'productivity', label: 'Productivity' },
      { key: 'ai', label: 'AI' },
      { key: 'accessibility', label: 'Accessibility' },
      { key: 'personalization', label: 'Personalization' },
      { key: 'experimental', label: 'Experimental' },
      { key: 'advanced', label: 'Advanced' },
    ],
  },
]

/** Stable shell (header + nav + search). The section content renders through <Outlet/> so switching
 *  tabs never remounts the header — see the nested routes in routes/index.tsx. */
export function SettingsPage() {
  return <SettingsShell groups={NAV_GROUPS} defaultSection="appearance" />
}

/** The swappable panel, chosen by the :section route param. Rendered inside SettingsShell's Outlet. */
export function SettingsContent() {
  const { section } = useParams<{ section: string }>()
  const plan = useWorkspacePlan()
  const active = section ?? 'appearance'

  switch (active) {
    case 'account':
      return (
        <div className="flex flex-col gap-8">
          <PersonalInfoSection />
          <HelpOnboardingSection />
        </div>
      )
    case 'plan':
      return <PlanSection />
    case 'payments':
      return <PaymentsSection plan={plan} />
    case 'notifications':
      return <NotificationsSection />
    case 'workspace':
      return <WorkspaceSection />
    case 'notes':
      return <NotesSection />
    case 'productivity':
      return <ProductivitySection />
    case 'ai':
      return <AiSection />
    case 'accessibility':
      return <AccessibilitySection />
    case 'personalization':
      return <PersonalizationSection />
    case 'experimental':
      return <ExperimentalSection />
    case 'advanced':
      return (
        <div className="flex flex-col gap-8">
          <AdvancedSection />
          {(process.env.NODE_ENV !== 'production') && <DeveloperSection />}
        </div>
      )
    case 'appearance':
    default:
      return <AppearanceSection />
  }
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
    <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-8">
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
          {(process.env.NODE_ENV !== 'production') && isLiveMode && (
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
 * Developer utilities, shown ONLY in dev builds. "Generate dummy data" reuses the existing
 * sample-workspace generator + repository (no second implementation) to seed the full sample dataset.
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
