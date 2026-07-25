import type { ReactElement } from 'react'
import { Bell } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu'
import type { Placement } from '@/lib/utils'
import { EmptyState } from '@/components/feedback/empty-state'

export interface NotificationsMenuProps {
  trigger: ReactElement<Record<string, unknown>>
  placement?: Placement
}

/** Shared notifications popover — same empty-state content whether opened from the sidebar or the topbar. */
export function NotificationsMenu({ trigger, placement = 'bottom-end' }: NotificationsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent width={288} placement={placement}>
        <EmptyState
          icon={<Bell />}
          title="No notifications"
          description="You're all caught up. New activity will show up here."
          className="py-8"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
