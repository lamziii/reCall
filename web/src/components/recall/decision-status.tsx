import { StatusBadge, type StatusTone } from '@/components/data-display/status-badge'

export type DecisionStatusValue = 'proposed' | 'pending-review' | 'approved' | 'rejected' | 'superseded'

const CONFIG: Record<DecisionStatusValue, { label: string; tone: StatusTone }> = {
  proposed: { label: 'Proposed', tone: 'neutral' },
  'pending-review': { label: 'Pending review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  superseded: { label: 'Superseded', tone: 'neutral' },
}

export function DecisionStatus({ status, className }: { status: DecisionStatusValue; className?: string }) {
  const { label, tone } = CONFIG[status]
  return <StatusBadge tone={tone} label={label} className={className} />
}
