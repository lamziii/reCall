import { AtSign, CheckSquare, ChevronDown, ChevronUp, ClipboardCheck, FolderKanban, GitBranch, Mic } from 'lucide-react'
import { Card } from '@/components/data-display/card'
import { IconButton } from '@/components/ui/button'
import { Small, Caption } from '@/components/typography'
import type { NotificationType } from '@/data/types'

const TYPE_ICON: Record<NotificationType, typeof Mic> = {
  'session-processed': Mic,
  'task-assigned': CheckSquare,
  'decision-approved': GitBranch,
  mention: AtSign,
  'project-update': FolderKanban,
  'review-required': ClipboardCheck,
}

const TYPE_LABEL: Record<NotificationType, string> = {
  'session-processed': 'Session processed',
  'task-assigned': 'Task assigned to you',
  'decision-approved': 'Decision approved',
  mention: 'Mentions',
  'project-update': 'Project updates',
  'review-required': 'Review required',
}

const TYPE_DESCRIPTION: Record<NotificationType, string> = {
  'session-processed': 'A recorded session finishes processing.',
  'task-assigned': 'Someone assigns you a task.',
  'decision-approved': 'A decision you raised gets approved.',
  mention: 'Someone @mentions you in a note or review.',
  'project-update': 'A project you follow changes status.',
  'review-required': 'A session review needs your input.',
}

export interface NotificationPriorityListProps {
  order: NotificationType[]
  onChange: (order: NotificationType[]) => void
  disabled?: boolean
}

/** Reorderable ranking of notification types, most → least important. Up/down controls rather
 *  than drag-and-drop, so reordering stays keyboard- and screen-reader-accessible. */
export function NotificationPriorityList({ order, onChange, disabled }: NotificationPriorityListProps) {
  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <Card className="flex flex-col gap-1 p-2">
      {order.map((type, index) => {
        const Icon = TYPE_ICON[type]
        return (
          <div key={type} className="flex items-center gap-3 rounded-lg p-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border-subtle text-caption font-medium text-subtle-foreground">
              {index + 1}
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-subtle-foreground">
              <Icon className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Small className="text-foreground">{TYPE_LABEL[type]}</Small>
              <Caption className="text-subtle-foreground">{TYPE_DESCRIPTION[type]}</Caption>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                icon={<ChevronUp />}
                label={`Move ${TYPE_LABEL[type]} up in priority`}
                size="sm"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
              />
              <IconButton
                icon={<ChevronDown />}
                label={`Move ${TYPE_LABEL[type]} down in priority`}
                size="sm"
                disabled={disabled || index === order.length - 1}
                onClick={() => move(index, 1)}
              />
            </div>
          </div>
        )
      })}
    </Card>
  )
}
