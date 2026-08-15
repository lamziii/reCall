import type { ReactNode } from 'react'
import { Avatar } from '@/components/data-display/avatar'
import { cn } from '@/lib/utils'
import { ConfidenceIndicator } from './confidence-indicator'
import { TimestampLink } from './timestamp-link'

export interface TranscriptSpeakerProps {
  name: string
  avatarSrc?: string
  timestamp: string
  confidence?: number
  children: ReactNode
  active?: boolean
  onTimestampClick?: () => void
  className?: string
}

/**
 * One transcript turn. `children` is the spoken text — compose Mention/EntityLink
 * inside it for highlighted references; this component doesn't parse text itself.
 */
export function TranscriptSpeaker({
  name,
  avatarSrc,
  timestamp,
  confidence,
  children,
  active,
  onTimestampClick,
  className,
}: TranscriptSpeakerProps) {
  return (
    <div className={cn('recall-transcript-turn flex gap-3 rounded-lg p-2 transition-fast', active && 'bg-surface-selected', className)}>
      <Avatar name={name} src={avatarSrc} size="sm" className="recall-speaker-avatar mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-small font-medium text-foreground">{name}</span>
          <TimestampLink time={timestamp} active={active} onClick={onTimestampClick} />
          {confidence !== undefined && <ConfidenceIndicator value={confidence} variant="compact" />}
        </div>
        <p className="text-small text-foreground">{children}</p>
      </div>
    </div>
  )
}
