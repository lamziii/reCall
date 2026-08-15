import { Badge } from '@/components/data-display/badge'
import { MENTION_ICONS, type MentionType } from './mention'

export type InsightType = MentionType | 'insight' | 'risk' | 'question'

const ICONS = {
  ...MENTION_ICONS,
  insight: MENTION_ICONS.document,
  risk: MENTION_ICONS.decision,
  question: MENTION_ICONS.person,
}

const LABEL: Record<InsightType, string> = {
  insight: 'Insight',
  risk: 'Risk',
  question: 'Question',
  decision: 'Decision',
  task: 'Task',
  document: 'Document',
  person: 'Person',
  project: 'Project',
  session: 'Session',
}

export function InsightLabel({ type, className }: { type: InsightType; className?: string }) {
  const Icon = ICONS[type]
  return (
    <Badge variant="outline" icon={<Icon />} className={className}>
      {LABEL[type]}
    </Badge>
  )
}
