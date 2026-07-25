import { useNavigate } from 'react-router-dom'
import { Sparkle } from 'lucide-react'
import { List, ListItem } from '@/components/data-display/list'
import { Avatar } from '@/components/data-display/avatar'
import { EmptyState } from '@/components/feedback/empty-state'
import { Caption, Title } from '@/components/typography'
import type { ActivityFeedItem } from '@/data/home/types'

export function RecentActivity({ items }: { items: ActivityFeedItem[] }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-3">
      <Title>Recent activity</Title>

      {items.length === 0 ? (
        <EmptyState icon={<Sparkle />} title="No recent activity" className="py-8" />
      ) : (
        <List>
          {items.map((item) => (
            <ListItem
              key={item.id}
              interactive
              role="link"
              tabIndex={0}
              onClick={() => navigate(item.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(item.href)
              }}
              leading={
                item.actorName ? (
                  <Avatar name={item.actorName} size="sm" />
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-full bg-surface-active text-subtle-foreground">
                    <Sparkle className="size-3.5" />
                  </span>
                )
              }
              trailing={
                <Caption className="whitespace-nowrap text-subtle-foreground" title={item.fullTimestampLabel}>
                  {item.relativeTimeLabel}
                </Caption>
              }
              className="gap-3"
            >
              <span className="text-small text-foreground">{item.sentence}</span>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  )
}
