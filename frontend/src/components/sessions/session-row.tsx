import { useNavigate } from 'react-router-dom'
import { CheckSquare, GitBranch } from 'lucide-react'
import { ListItem } from '@/components/data-display/list'
import { cn } from '@/lib/utils'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { StatusDot } from '@/components/data-display/status-dot'
import { SessionStatus } from '@/components/recall/session-status'
import { Caption } from '@/components/typography'
import type { SessionListItem } from '@/data/sessions/types'

export function SessionRow({ session }: { session: SessionListItem }) {
  const navigate = useNavigate()

  function open() {
    navigate(`/app/sessions/${session.id}`)
  }

  return (
    <ListItem
      interactive
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open()
      }}
      className="items-start gap-4 py-3.5"
      leading={
        <span
          className={cn('mt-1.5 flex size-1.5 shrink-0 rounded-full', session.needsAttention && 'bg-warning')}
          aria-label={session.needsAttention ? 'Needs attention' : undefined}
        />
      }
      trailing={
        <div className="flex flex-col items-end gap-1.5 text-right">
          {session.status === 'processing' || session.status === 'recording' ? (
            <span className="inline-flex items-center gap-1.5">
              <StatusDot state="processing" />
              <Caption className="text-muted-foreground">{session.status === 'recording' ? 'Recording' : 'Processing'}</Caption>
            </span>
          ) : (
            <SessionStatus status={session.status} />
          )}
          <Caption className="text-subtle-foreground">
            {session.dateLabel} · {session.timeLabel}
          </Caption>
        </div>
      }
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-small font-medium text-foreground">{session.title}</span>
          {session.participantNames.length > 0 && (
            <AvatarGroup max={3} spacing="compact">
              {session.participantNames.map((name) => (
                <Avatar key={name} name={name} size="xs" />
              ))}
            </AvatarGroup>
          )}
        </div>
        <Caption className="line-clamp-1 text-muted-foreground">{session.summaryPreview}</Caption>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-subtle-foreground">
          {session.projectName && <span>{session.projectName}</span>}
          <span>{session.durationLabel}</span>
          {session.decisionsCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <GitBranch className="size-3" />
              {session.decisionsCount}
            </span>
          )}
          {session.tasksCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="size-3" />
              {session.tasksCount}
            </span>
          )}
        </div>
      </div>
    </ListItem>
  )
}
