import { formatRecallDate, formatRecallTime } from '@/settings/format'

const DAY_MS = 86_400_000

export function formatDateLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS)

  // Near-term stays human ("Today"/"Tomorrow"); the absolute fallback honors the user's Date format.
  if (diffDays === 0) return 'Today'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays === 1) return 'Tomorrow'
  return formatRecallDate(date, { withYear: false })
}

export function formatTimeLabel(iso: string): string {
  return formatRecallTime(iso)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

export function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function formatRelativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const diffHours = diffMs / (60 * 60 * 1000)
  if (Math.abs(diffHours) < 1) return RELATIVE_TIME.format(Math.round(diffMs / 60_000), 'minute')
  if (Math.abs(diffHours) < 24) return RELATIVE_TIME.format(Math.round(diffHours), 'hour')
  return RELATIVE_TIME.format(Math.round(diffHours / 24), 'day')
}

export function formatDueLabel(iso?: string): string | undefined {
  if (!iso) return undefined
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - now.getTime()) / DAY_MS)

  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due ${new Date(iso).toLocaleDateString(undefined, { weekday: 'short' })}`
  return `Due ${formatRecallDate(iso, { withYear: false })}`
}

export function greetingForHour(hour: number): 'Good morning' | 'Good afternoon' | 'Good evening' {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
