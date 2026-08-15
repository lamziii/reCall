import { StatusBadge, type StatusTone } from '@/components/data-display/status-badge'

export type SessionStatusValue = 'scheduled' | 'recording' | 'paused' | 'processing' | 'ready' | 'needs-review' | 'archived' | 'failed'

const CONFIG: Record<SessionStatusValue, { label: string; tone: StatusTone }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  recording: { label: 'Recording', tone: 'danger' },
  paused: { label: 'Paused', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  ready: { label: 'Ready', tone: 'success' },
  'needs-review': { label: 'Needs review', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
}

export function SessionStatus({ status, className }: { status: SessionStatusValue; className?: string }) {
  const { label, tone } = CONFIG[status]
  return <StatusBadge tone={tone} label={label} className={className} />
}
