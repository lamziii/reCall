import { Circle, Loader2, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecordingStatus as RecordingStatusValue } from '@/data/recording/recording-types'

const CONFIG: Record<RecordingStatusValue, { label: string; icon: typeof Circle; className: string; pulse?: boolean }> = {
  idle: { label: 'Idle', icon: Circle, className: 'text-subtle-foreground' },
  'requesting-permission': { label: 'Requesting microphone access…', icon: Loader2, className: 'text-muted-foreground' },
  recording: { label: 'Recording', icon: Circle, className: 'text-danger', pulse: true },
  paused: { label: 'Paused', icon: Pause, className: 'text-warning' },
  stopping: { label: 'Stopping…', icon: Loader2, className: 'text-muted-foreground' },
  stopped: { label: 'Stopped', icon: Circle, className: 'text-subtle-foreground' },
  error: { label: 'Error', icon: Circle, className: 'text-danger' },
}

export function RecordingStatus({ status, className }: { status: RecordingStatusValue; className?: string }) {
  const { label, icon: Icon, className: toneClassName, pulse } = CONFIG[status]

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-small font-medium', toneClassName, className)} role="status">
      <Icon className={cn('size-3', pulse && 'animate-pulse', (status === 'requesting-permission' || status === 'stopping') && 'animate-spin')} fill={status === 'recording' ? 'currentColor' : 'none'} />
      {label}
    </span>
  )
}
