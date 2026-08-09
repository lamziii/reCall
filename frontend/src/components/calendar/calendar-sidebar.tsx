import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/data-display/card'
import { EmptyState } from '@/components/feedback/empty-state'
import { Caption, H3, Small } from '@/components/typography'
import type { CalendarDeadlineItem, CalendarListItem } from '@/data/calendar/types'
import { cn } from '@/lib/utils'

function SessionSection({ title, items, emptyLabel }: { title: string; items: CalendarListItem[]; emptyLabel: string }) {
  const navigate = useNavigate()
  return (
    <Card className="flex flex-col gap-3 p-4">
      <H3 className="text-small font-semibold">{title}</H3>
      {items.length === 0 ? (
        <Caption className="text-subtle-foreground">{emptyLabel}</Caption>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/app/sessions/${item.id}`)}
              className="focus-ring flex flex-col gap-0.5 rounded-md text-left transition-fast hover:text-accent"
            >
              <Small className="truncate font-medium text-foreground" title={item.title}>
                {item.title}
              </Small>
              <Caption className="truncate text-subtle-foreground">
                {item.dateLabel} · {item.timeLabel}
                {item.projectName ? ` · ${item.projectName}` : ''}
              </Caption>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

export interface CalendarSidebarProps {
  upcomingMeetings: CalendarListItem[]
  todaysAgenda: CalendarListItem[]
  upcomingDeadlines: CalendarDeadlineItem[]
  recentSessions: CalendarListItem[]
}

export function CalendarSidebar({ upcomingMeetings, todaysAgenda, upcomingDeadlines, recentSessions }: CalendarSidebarProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <SessionSection title="Today's agenda" items={todaysAgenda} emptyLabel="Nothing scheduled today." />
      <SessionSection title="Upcoming meetings" items={upcomingMeetings} emptyLabel="No upcoming meetings." />

      <Card className="flex flex-col gap-3 p-4">
        <H3 className="text-small font-semibold">Upcoming deadlines</H3>
        {upcomingDeadlines.length === 0 ? (
          <Caption className="text-subtle-foreground">No upcoming deadlines.</Caption>
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcomingDeadlines.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate('/app/tasks')}
                className="focus-ring flex flex-col gap-0.5 rounded-md text-left transition-fast hover:text-accent"
              >
                <Small className="line-clamp-2 font-medium text-foreground" title={task.title}>
                  {task.title}
                </Small>
                <Caption className={cn('truncate text-subtle-foreground', task.isOverdue && 'font-medium text-danger')}>{task.dueDateLabel}</Caption>
              </button>
            ))}
          </div>
        )}
      </Card>

      <SessionSection title="Recent sessions" items={recentSessions} emptyLabel="No recent sessions." />

      {upcomingMeetings.length === 0 && todaysAgenda.length === 0 && upcomingDeadlines.length === 0 && recentSessions.length === 0 && (
        <EmptyState title="Nothing to show yet" className="py-4" />
      )}
    </div>
  )
}
