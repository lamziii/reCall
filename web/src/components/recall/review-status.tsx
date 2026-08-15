import { StatusBadge, type StatusTone } from '@/components/data-display/status-badge'

export type ReviewStatusValue = 'pending' | 'approved' | 'needs-edits'

const CONFIG: Record<ReviewStatusValue, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  'needs-edits': { label: 'Needs edits', tone: 'danger' },
}

export function ReviewStatus({ status, className }: { status: ReviewStatusValue; className?: string }) {
  const { label, tone } = CONFIG[status]
  return <StatusBadge tone={tone} label={label} className={className} />
}
