import { GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Surface } from '@/components/layout/surface'
import { DecisionStatus } from '@/components/recall/decision-status'
import { ConfidenceIndicator } from '@/components/recall/confidence-indicator'
import { Assignee } from '@/components/recall/assignee'
import { Small } from '@/components/typography'
import { EmptyState } from '@/components/feedback/empty-state'
import type { SessionDecisionItem } from '@/data/sessions/types'

const PENDING = new Set(['proposed', 'pending-review'])

export interface DecisionListProps {
  decisions: SessionDecisionItem[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function DecisionList({ decisions, onApprove, onReject }: DecisionListProps) {
  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={<GitBranch />}
        title="No decisions captured"
        description="Decisions extracted from this session will appear here."
        className="py-8"
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {decisions.map((decision) => (
        <Surface key={decision.id} level="surface" border padding="md" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Small className="font-medium text-foreground">{decision.title}</Small>
            <DecisionStatus status={decision.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-subtle-foreground">
            <Assignee name={decision.ownerName} compact />
            {decision.confidence !== undefined && <ConfidenceIndicator value={decision.confidence} />}
            <span>{decision.timestampLabel}</span>
            {decision.projectName && <span>{decision.projectName}</span>}
            {decision.linkedTaskCount > 0 && (
              <span>
                {decision.linkedTaskCount} linked task{decision.linkedTaskCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {PENDING.has(decision.status) && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => onApprove(decision.id)}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onReject(decision.id)}>
                Reject
              </Button>
            </div>
          )}
        </Surface>
      ))}
    </div>
  )
}
