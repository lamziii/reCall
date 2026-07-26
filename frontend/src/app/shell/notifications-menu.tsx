import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { Placement } from '@/lib/utils'
import { EmptyState } from '@/components/feedback/empty-state'
import { Caption, Small } from '@/components/typography'
import { useNotificationsData } from '@/data/notifications/use-notifications-data'
import { cn } from '@/lib/utils'

export interface NotificationsMenuProps {
  trigger: ReactElement<Record<string, unknown>>
  placement?: Placement
}

/** Shared notifications popover — same content whether opened from the sidebar or the topbar. */
export function NotificationsMenu({ trigger, placement = 'bottom-end' }: NotificationsMenuProps) {
  const navigate = useNavigate()
  const { state, markRead } = useNotificationsData()
  const items = state.status === 'success' ? state.data.items.slice(0, 5) : []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent width={320} placement={placement}>
        {items.length === 0 ? (
          <EmptyState
            icon={<Bell />}
            title="No notifications"
            description="You're all caught up. New activity will show up here."
            className="py-8"
          />
        ) : (
          <>
            {items.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => {
                  if (!notification.read) markRead(notification.id)
                  if (notification.href) navigate(notification.href)
                }}
              >
                <span className="flex w-full items-start gap-2">
                  <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', notification.read ? 'bg-transparent' : 'bg-accent')} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <Small className={cn('truncate text-foreground', !notification.read && 'font-medium')}>{notification.title}</Small>
                    <Caption className="text-subtle-foreground">{notification.relativeTimeLabel}</Caption>
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/app/notifications')}>View all notifications</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
