import { useNavigate } from '@/lib/router-compat'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { List, ListItem } from '@/components/data-display/list'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { EmptyState } from '@/components/feedback/empty-state'
import { Body, Caption, Title } from '@/components/typography'
import type { ScheduledSession } from '@/data/home/types'

export function TodaySchedule({ sessions }: { sessions: ScheduledSession[] }) {
  const navigate = useNavigate()

  return (
    <div className="flex h-full min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Title>Today's schedule</Title>
        <Button variant="text" size="sm" leftIcon={<Calendar />} onClick={() => navigate('/app/calendar')} className="shrink-0">
          View calendar
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar />}
          title="No more meetings today"
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/calendar')}>
              Schedule a session
            </Button>
          }
          className="flex-1 py-8"
        />
      ) : (
        <List>
          {sessions.map((session) => (
            <ListItem
              key={session.id}
              interactive
              onClick={() => navigate(session.href)}
              tabIndex={0}
              role="link"
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(session.href)
              }}
              leading={<Caption className="w-16 shrink-0 tabular-nums text-muted-foreground">{session.timeLabel}</Caption>}
              trailing={
                session.participantNames.length > 0 ? (
                  <AvatarGroup max={3} spacing="compact">
                    {session.participantNames.map((name) => (
                      <Avatar key={name} name={name} size="xs" />
                    ))}
                  </AvatarGroup>
                ) : undefined
              }
              className="gap-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-small font-medium text-foreground">{session.title}</span>
                {session.projectName && <Body className="truncate text-caption text-muted-foreground">{session.projectName}</Body>}
              </span>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  )
}
