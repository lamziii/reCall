import { Pause, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RecordingStatus } from '@/data/recording/recording-types'

export interface RecordingControlsProps {
  status: RecordingStatus
  onPause: () => void
  onResume: () => void
  onStop: () => void
  className?: string
}

export function RecordingControls({ status, onPause, onResume, onStop, className }: RecordingControlsProps) {
  const isPaused = status === 'paused'
  const busy = status === 'requesting-permission' || status === 'stopping'

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-3">
        {isPaused ? (
          <Button variant="secondary" leftIcon={<Play />} onClick={onResume} disabled={busy} aria-label="Resume recording">
            Resume
          </Button>
        ) : (
          <Button variant="secondary" leftIcon={<Pause />} onClick={onPause} disabled={busy || status !== 'recording'} aria-label="Pause recording">
            Pause
          </Button>
        )}
        <Button variant="outline" leftIcon={<Square className="fill-current" />} onClick={onStop} disabled={busy} aria-label="Stop recording">
          Stop recording
        </Button>
      </div>
    </div>
  )
}
