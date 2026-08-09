import { useNavigate } from 'react-router-dom'
import { AtSign, Bell, CheckCheck, CheckSquare, ClipboardCheck, FolderKanban, GitBranch, Mic } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/data-display/card'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/feedback/skeleton'
import { Caption, H3, Small } from '@/components/typography'
import { useNotificationsData } from '@/data/notifications/use-notifications-data'
import type { NotificationGroupKey, NotificationListItem } from '@/data/notifications/types'
import type { NotificationType } from '@/data/types'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  'session-processed': Mic,
  'task-assigned': CheckSquare,
  'decision-approved': GitBranch,
  mention: AtSign,
  'project-update': FolderKanban,
  'review-required': ClipboardCheck,
}

const GROUP_LABEL: Record<NotificationGroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  earlier: 'Earlier',
}

const GROUP_ORDER: NotificationGroupKey[] = ['today', 'yesterday', 'earlier']

function NotificationRow({
  notification,
  onOpen,
  onMarkRead,
}: {
  notification: NotificationListItem
  onOpen: (n: NotificationListItem) => void
  onMarkRead: (id: string) => void
}) {
  const Icon = TYPE_ICON[notification.type]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(notification)
      }}
      className={cn(
        'focus-ring flex w-full items-start gap-3 rounded-lg p-3 text-left transition-fast hover:bg-surface-hover',
        notification.href && 'cursor-pointer',
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-subtle-foreground">
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Small className={cn('truncate text-foreground', !notification.read && 'font-medium')} title={notification.title}>
          {notification.title}
        </Small>
        <Caption className="line-clamp-2 text-subtle-foreground">{notification.description}</Caption>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <Caption className="whitespace-nowrap text-subtle-foreground">{notification.relativeTimeLabel}</Caption>
        {!notification.read && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Mark as read"
            title="Mark as read"
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(notification.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                onMarkRead(notification.id)
              }
            }}
            className="focus-ring flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full"
          >
            <span className="size-1.5 rounded-full bg-accent" />
          </span>
        )}
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { state, markRead, markAllRead } = useNotificationsData()

  function handleOpen(notification: NotificationListItem) {
    if (!notification.read) markRead(notification.id)
    if (notification.href) navigate(notification.href)
  }

  const unreadCount = state.status === 'success' ? state.data.unreadCount : 0

  const actions = (
    <Button variant="secondary" leftIcon={<CheckCheck />} onClick={markAllRead} disabled={unreadCount === 0}>
      Mark all as read
    </Button>
  )

  if (state.status === 'loading') {
    return (
      <PageContainer>
        <PageHeader title="Notifications" description="Everything that needs your attention, in one place." />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </PageContainer>
    )
  }

  if (state.status === 'error') {
    return (
      <PageContainer>
        <PageHeader title="Notifications" description="Everything that needs your attention, in one place." />
        <ErrorState title="We couldn't load your notifications" />
      </PageContainer>
    )
  }

  if (state.status === 'empty') {
    return (
      <PageContainer>
        <PageHeader title="Notifications" description="Everything that needs your attention, in one place." />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={<Bell />} title="No notifications" description="You're all caught up. New activity will show up here." />
        </div>
      </PageContainer>
    )
  }

  const { data } = state

  return (
    <PageContainer>
      <PageHeader title="Notifications" description="Everything that needs your attention, in one place." actions={actions} />

      <div className="flex flex-col gap-6">
        {GROUP_ORDER.map((group) => {
          const items = data.items.filter((n) => n.group === group)
          if (items.length === 0) return null
          return (
            <section key={group} className="flex flex-col gap-2">
              <H3 className="text-small font-semibold text-subtle-foreground">{GROUP_LABEL[group]}</H3>
              <Card className="flex flex-col gap-1 p-2">
                {items.map((notification) => (
                  <NotificationRow key={notification.id} notification={notification} onOpen={handleOpen} onMarkRead={markRead} />
                ))}
              </Card>
            </section>
          )
        })}
      </div>
    </PageContainer>
  )
}
