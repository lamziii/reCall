import { Mic, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Caption, H2, Small } from '@/components/typography'
import { greetingForHour } from '@/data/home/home-dashboard-service'
import type { HomeDashboardData } from '@/data/home/types'

export function HomeHeader({
  greeting,
  onRecordSession,
  onImportRecording,
}: {
  greeting: HomeDashboardData['greeting']
  onRecordSession: () => void
  onImportRecording: () => void
}) {
  const greetingWord = greetingForHour(new Date().getHours())

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <Caption className="text-subtle-foreground">{greeting.dateLabel}</Caption>
        <H2 as="h1">
          {greetingWord}, {greeting.userName}
        </H2>
        <Small className="text-muted-foreground">Here's what needs your attention across {greeting.workspaceName}.</Small>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" leftIcon={<Upload />} onClick={onImportRecording}>
          Import recording
        </Button>
        <Button leftIcon={<Mic />} onClick={onRecordSession}>
          Record a session
        </Button>
      </div>
    </div>
  )
}
