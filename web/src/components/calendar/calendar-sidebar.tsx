import type { ReactNode } from 'react'
import { useNavigate } from '@/lib/router-compat'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, CalendarClock, Clock, History } from 'lucide-react'
import { Surface } from '@/components/layout/surface'
import { List, ListItem } from '@/components/data-display/list'
import { StatusBadge } from '@/components/data-display/status-badge'
import { Caption, Small, Title } from '@/components/typography'
import { staggerContainer, staggerItem } from '@/styles/animations/presets'
import type { CalendarDeadlineItem, CalendarListItem } from '@/data/calendar/types'

function SectionHeader({ icon, title, count }: { icon: ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-active text-subtle-foreground [&>svg]:size-3.5">
          {icon}
        </span>
        <Title className="text-small font-semibold">{title}</Title>
      </div>
      {count > 0 && <Caption className="tabular-nums text-subtle-foreground">{count}</Caption>}
    </div>
  )
}

function SessionSection({
  icon,
  title,
  items,
  emptyLabel,
  showTime,
}: {
  icon: ReactNode
  title: string
  items: CalendarListItem[]
  emptyLabel: string
  showTime?: boolean
}) {
  const navigate = useNavigate()
  return (
    <Surface level="raised" border className="overflow-hidden">
      <SectionHeader icon={icon} title={title} count={items.length} />
      {items.length === 0 ? (
        <Caption className="block px-4 pb-3.5 pt-2 text-subtle-foreground">{emptyLabel}</Caption>
      ) : (
        <List className="mt-2 pb-1">
          {items.map((item) => (
            <ListItem
              key={item.id}
              interactive
              onClick={() => navigate(`/app/sessions/${item.id}`)}
              className="px-4"
              leading={showTime ? <Caption className="w-12 shrink-0 tabular-nums text-muted-foreground">{item.timeLabel}</Caption> : undefined}
            >
              <span className="flex min-w-0 flex-col">
                <Small className="truncate font-medium text-foreground">{item.title}</Small>
                <Caption className="truncate text-subtle-foreground">
                  {showTime ? (item.projectName ?? 'No project') : `${item.dateLabel} · ${item.timeLabel}${item.projectName ? ` · ${item.projectName}` : ''}`}
                </Caption>
              </span>
            </ListItem>
          ))}
        </List>
      )}
    </Surface>
  )
}

function DeadlinesSection({ items }: { items: CalendarDeadlineItem[] }) {
  const navigate = useNavigate()
  return (
    <Surface level="raised" border className="overflow-hidden">
      <SectionHeader icon={<AlertCircle />} title="Upcoming deadlines" count={items.length} />
      {items.length === 0 ? (
        <Caption className="block px-4 pb-3.5 pt-2 text-subtle-foreground">No upcoming deadlines.</Caption>
      ) : (
        <List className="mt-2 pb-1">
          {items.map((task) => (
            <ListItem
              key={task.id}
              interactive
              onClick={() => navigate('/app/tasks')}
              className="px-4"
              trailing={task.isOverdue ? <StatusBadge tone="danger" label="Overdue" /> : <Caption className="text-subtle-foreground">{task.dueDateLabel}</Caption>}
            >
              <Small className="truncate font-medium text-foreground">{task.title}</Small>
            </ListItem>
          ))}
        </List>
      )}
    </Surface>
  )
}

export interface CalendarSidebarProps {
  upcomingMeetings: CalendarListItem[]
  todaysAgenda: CalendarListItem[]
  upcomingDeadlines: CalendarDeadlineItem[]
  recentSessions: CalendarListItem[]
}

export function CalendarSidebar({ upcomingMeetings, todaysAgenda, upcomingDeadlines, recentSessions }: CalendarSidebarProps) {
  const reduceMotion = useReducedMotion()
  const containerVariants = reduceMotion ? undefined : staggerContainer
  const itemVariants = reduceMotion ? undefined : staggerItem

  return (
    <motion.div className="flex flex-col gap-4" variants={containerVariants} initial="initial" animate="animate">
      <motion.div variants={itemVariants}>
        <SessionSection icon={<Clock />} title="Today's agenda" items={todaysAgenda} emptyLabel="Nothing scheduled today." showTime />
      </motion.div>
      <motion.div variants={itemVariants}>
        <SessionSection icon={<CalendarClock />} title="Upcoming meetings" items={upcomingMeetings} emptyLabel="No upcoming meetings." />
      </motion.div>
      <motion.div variants={itemVariants}>
        <DeadlinesSection items={upcomingDeadlines} />
      </motion.div>
      <motion.div variants={itemVariants}>
        <SessionSection icon={<History />} title="Recent sessions" items={recentSessions} emptyLabel="No recent sessions." />
      </motion.div>
    </motion.div>
  )
}
