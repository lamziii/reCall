import { Mic, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Caption, H2, Small } from '@/components/typography'
import { greetingForHour } from '@/data/home/home-dashboard-service'
import type { HomeDashboardData } from '@/data/home/types'
import { useRecallPreferences } from '@/settings/settings-context'
import type { QuickActionId } from '@/settings/types'

export function HomeHeader({
  greeting,
  onRecordSession,
  onImportRecording,
}: {
  greeting: HomeDashboardData['greeting']
  onRecordSession: () => void
  onImportRecording: () => void
}) {
  const { preferences } = useRecallPreferences()
  const personalized = preferences.personalization.greeting === 'personalized'
  const greetingWord = greetingForHour(new Date().getHours())

  // Quick actions the header can render, in the user's configured order, filtered to enabled ones.
  const handlers: Partial<Record<QuickActionId, { label: string; icon: React.ReactNode; onClick: () => void; primary?: boolean }>> = {
    'new-recording': { label: 'Record a session', icon: <Mic />, onClick: onRecordSession, primary: true },
    'upload-transcript': { label: 'Import recording', icon: <Upload />, onClick: onImportRecording },
  }
  const actions = preferences.productivity.quickActions
    .filter((a) => a.enabled && handlers[a.id])
    .map((a) => ({ id: a.id, ...handlers[a.id]! }))

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <Caption className="text-subtle-foreground">{greeting.dateLabel}</Caption>
        <H2 as="h1">{personalized ? `${greetingWord}, ${greeting.userName}` : 'Home'}</H2>
        {personalized && (
          <Small className="text-muted-foreground">Here's what needs your attention across {greeting.workspaceName}.</Small>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex shrink-0 items-center gap-2">
          {actions.map((action) =>
            action.primary ? (
              <Button key={action.id} leftIcon={action.icon} onClick={action.onClick}>
                {action.label}
              </Button>
            ) : (
              <Button key={action.id} variant="ghost" leftIcon={action.icon} onClick={action.onClick}>
                {action.label}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
