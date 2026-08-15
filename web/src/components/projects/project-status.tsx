import { StatusBadge, type StatusTone } from '@/components/data-display/status-badge'
import type { ProjectStatus as ProjectStatusValue } from '@/data/types'

const CONFIG: Record<ProjectStatusValue, { label: string; tone: StatusTone }> = {
  planning: { label: 'Planning', tone: 'neutral' },
  active: { label: 'Active', tone: 'info' },
  'at-risk': { label: 'At risk', tone: 'danger' },
  'on-hold': { label: 'On hold', tone: 'warning' },
  done: { label: 'Completed', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export function ProjectStatus({ status, className }: { status: ProjectStatusValue; className?: string }) {
  const { label, tone } = CONFIG[status]
  return <StatusBadge tone={tone} label={label} className={className} />
}
