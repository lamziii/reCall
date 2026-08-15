import { useNavigate } from '@/lib/router-compat'
import { FileText } from 'lucide-react'
import { Surface } from '@/components/layout/surface'
import { Button } from '@/components/ui/button'
import { Body, Caption, Title } from '@/components/typography'
import { Avatar, AvatarGroup } from '@/components/data-display/avatar'
import { SessionStatus } from '@/components/recall/session-status'
import type { PrimaryAttention } from '@/data/home/types'

export function AttentionCard({ item }: { item: PrimaryAttention | null }) {
  const navigate = useNavigate()

  if (!item) return null

  if (item.kind === 'task') {
    return (
      <Surface level="raised" border padding="lg" className="flex min-w-0 flex-col gap-4">
        <Caption className="text-subtle-foreground">Needs your attention</Caption>
        <div className="flex flex-col gap-1.5">
          <Title>{item.title}</Title>
          <Body className="text-muted-foreground">
            {item.projectName ?? 'No project'} · {item.dueLabel}
          </Body>
        </div>
        <Button className="w-fit" onClick={() => navigate(item.href)}>
          Open task
        </Button>
      </Surface>
    )
  }

  return (
    <Surface level="raised" border padding="lg" className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Caption className="text-subtle-foreground">Continue where you left off</Caption>
        <SessionStatus status={item.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Title>{item.title}</Title>
        <Body className="text-muted-foreground">
          {[item.projectName, item.dateLabel, item.durationLabel].filter(Boolean).join(' · ')}
        </Body>
      </div>

      {item.participantNames.length > 0 && (
        <AvatarGroup max={5}>
          {item.participantNames.map((name) => (
            <Avatar key={name} name={name} size="sm" />
          ))}
        </AvatarGroup>
      )}

      <Body className="text-foreground">{item.summary}</Body>

      <Caption className="text-subtle-foreground">
        {item.decisionsAwaitingReview} decision{item.decisionsAwaitingReview === 1 ? '' : 's'} awaiting review · {item.openTasks} open
        task{item.openTasks === 1 ? '' : 's'}
      </Caption>

      <div className="flex items-center gap-2">
        <Button onClick={() => navigate(item.href)}>Review session</Button>
        <Button variant="ghost" leftIcon={<FileText />} onClick={() => navigate(item.transcriptHref)}>
          Open transcript
        </Button>
      </div>
    </Surface>
  )
}
