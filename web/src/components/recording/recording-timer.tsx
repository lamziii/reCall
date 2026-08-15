import { VisuallyHidden } from '@/components/primitives/visually-hidden'
import { cn } from '@/lib/utils'

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

function spokenDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = [hours && `${hours} hours`, minutes && `${minutes} minutes`, `${seconds} seconds`].filter(Boolean)
  return parts.join(' ')
}

export function RecordingTimer({ seconds, className }: { seconds: number; className?: string }) {
  return (
    <div className={cn('font-mono text-display tabular-nums text-foreground', className)}>
      <span aria-hidden="true">{formatElapsed(seconds)}</span>
      <VisuallyHidden>Elapsed recording time: {spokenDuration(seconds)}</VisuallyHidden>
    </div>
  )
}
