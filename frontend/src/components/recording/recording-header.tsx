import { Mic } from 'lucide-react'
import { BackButton } from '@/components/navigation/back-button'
import { Caption, Title } from '@/components/typography'
import { RecordingStatus } from './recording-status'
import { RecordingTimer } from './recording-timer'
import type { RecordingStatus as RecordingStatusValue } from '@/data/recording/recording-types'

export interface RecordingHeaderProps {
  title: string
  status: RecordingStatusValue
  elapsedSeconds: number
  deviceLabel: string | null
  onLeave: () => void
}

export function RecordingHeader({ title, status, elapsedSeconds, deviceLabel, onLeave }: RecordingHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <BackButton label="Leave" onClick={onLeave} className="self-start" />

      <div className="flex flex-col items-center gap-1.5">
        <Title className="text-foreground">{title}</Title>
        <div className="flex items-center gap-3">
          <RecordingStatus status={status} />
          {deviceLabel && (
            <Caption className="inline-flex items-center gap-1 text-subtle-foreground">
              <Mic className="size-3" />
              {deviceLabel}
            </Caption>
          )}
        </div>
      </div>

      <RecordingTimer seconds={elapsedSeconds} />
    </div>
  )
}
