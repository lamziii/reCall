import { cn } from '@/lib/utils'

export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

const LABEL: Record<RecordingState, string> = {
  idle: 'Idle',
  recording: 'Recording',
  paused: 'Paused',
  processing: 'Processing',
}

const DOT_COLOR: Record<RecordingState, string> = {
  idle: 'bg-disabled-foreground',
  recording: 'bg-danger',
  paused: 'bg-warning',
  processing: 'bg-accent',
}

/** The live-recording affordance — only `recording` pulses; a blinking red dot is a meaningful, universally-understood signal here, not decoration. */
export function RecordingIndicator({ state, className }: { state: RecordingState; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-small font-medium text-foreground', className)}>
      <span className="relative flex size-2">
        {state === 'recording' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-50" />}
        <span className={cn('relative inline-flex size-2 rounded-full', DOT_COLOR[state])} />
      </span>
      {LABEL[state]}
    </span>
  )
}
