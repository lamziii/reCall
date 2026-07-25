import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { List, ListItem } from '@/components/data-display/list'
import { SegmentedControl } from '@/components/forms/segmented-control'
import { InsightLabel } from '@/components/recall/insight-label'
import { EmptyState } from '@/components/feedback/empty-state'
import { CheckSquare, Inbox } from 'lucide-react'
import { Caption, Title } from '@/components/typography'
import type { AttentionItem, AttentionType } from '@/data/home/types'

const FILTERS: { value: 'all' | AttentionType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'decision', label: 'Decisions' },
  { value: 'task', label: 'Tasks' },
  { value: 'question', label: 'Questions' },
  { value: 'risk', label: 'Risks' },
]

export function AttentionList({ items }: { items: AttentionItem[] }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | AttentionType>('all')

  const visible = filter === 'all' ? items : items.filter((i) => i.type === filter)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Title>Needs attention</Title>
        <div className="flex items-center gap-2">
          <SegmentedControl aria-label="Filter needs attention" value={filter} onChange={(v) => setFilter(v as typeof filter)} options={FILTERS} size="sm" />
          <Button variant="text" size="sm" leftIcon={<Inbox />} onClick={() => navigate('/app/reviews')}>
            View all
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<CheckSquare />} title="Nothing needs attention" description="You're all caught up." className="py-8" />
      ) : (
        <List>
          {visible.map((item) => (
            <ListItem
              key={item.id}
              interactive
              role="link"
              tabIndex={0}
              onClick={() => navigate(item.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(item.href)
              }}
              leading={<InsightLabel type={item.type} />}
              trailing={
                <span className="flex flex-col items-end gap-0.5 text-right">
                  {item.dueLabel && <Caption className="text-warning">{item.dueLabel}</Caption>}
                  {item.ownerName && <Caption className="text-subtle-foreground">{item.ownerName}</Caption>}
                </span>
              }
              className="gap-3"
            >
              <span className="flex flex-col">
                <span className="truncate text-small font-medium text-foreground">{item.title}</span>
                {(item.projectName || item.sourceSessionTitle) && (
                  <Caption className="truncate text-subtle-foreground">
                    {[item.projectName, item.sourceSessionTitle].filter(Boolean).join(' · ')}
                  </Caption>
                )}
              </span>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  )
}
