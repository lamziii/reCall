import { Calendar, Clock, FolderKanban, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SessionStatus, type SessionStatusValue } from './session-status'

export interface SessionMetadataProps {
  date: string
  duration: string
  project?: string
  participantCount?: number
  status?: SessionStatusValue
  className?: string
}

/** Compact metadata row for a session card/list row — date, duration, project, participants, status. */
export function SessionMetadata({ date, duration, project, participantCount, status, className }: SessionMetadataProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-small text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="size-3.5" />
        {date}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-3.5" />
        {duration}
      </span>
      {project && (
        <span className="inline-flex items-center gap-1.5">
          <FolderKanban className="size-3.5" />
          {project}
        </span>
      )}
      {participantCount !== undefined && (
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" />
          {participantCount} participants
        </span>
      )}
      {status && <SessionStatus status={status} />}
    </div>
  )
}
