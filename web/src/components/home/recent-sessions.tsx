import { useNavigate } from '@/lib/router-compat'
import { Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { List, ListItem } from '@/components/data-display/list'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { SessionStatus } from '@/components/recall/session-status'
import { EmptyState } from '@/components/feedback/empty-state'
import { Caption, Title } from '@/components/typography'
import type { SessionSummary } from '@/data/home/types'

export function RecentSessions({ sessions }: { sessions: SessionSummary[] }) {
  const navigate = useNavigate()

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Title>Recent sessions</Title>
        <Button variant="text" size="sm" onClick={() => navigate('/app/sessions')} className="shrink-0">
          View all
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={<Mic />} title="No sessions yet" description="Recorded sessions will show up here." className="py-8" />
      ) : (
        <List>
          {sessions.map((session) => (
            <ListItem
              key={session.id}
              interactive
              role="link"
              tabIndex={0}
              onClick={() => navigate(session.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(session.href)
              }}
              trailing={<SessionStatus status={session.status} />}
              className="items-start gap-3 py-3"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-small font-medium text-foreground">{session.title}</span>
                  {session.participantNames.length > 0 && (
                    <AvatarGroup max={3} spacing="compact">
                      {session.participantNames.map((name) => (
                        <Avatar key={name} name={name} size="xs" />
                      ))}
                    </AvatarGroup>
                  )}
                </span>
                <Caption className="truncate text-subtle-foreground">
                  {[session.projectName, session.dateLabel, session.durationLabel].filter(Boolean).join(' · ')}
                </Caption>
                <Caption className="line-clamp-1 text-muted-foreground">{session.summaryPreview}</Caption>
              </span>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  )
}
