import { getWorkspaceData } from '../workspace-repository'
import type { Project, SessionRecord } from '../types'
import { formatDateLabel, formatDueLabel, formatTimeLabel } from '../home/format'
import type { CalendarDay, CalendarDeadlineItem, CalendarListItem, CalendarMonthData } from './types'

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function projectName(projects: Project[], id?: string): string | undefined {
  return id ? projects.find((p) => p.id === id)?.name : undefined
}

function buildGrid(year: number, month: number, sessions: SessionRecord[]): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay())
  const today = startOfDay(new Date())

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    const daySessions = sessions
      .filter((s) => sameDay(new Date(s.date), date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      dateIso: date.toISOString(),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: sameDay(date, today),
      sessions: daySessions.map((s) => ({ id: s.id, title: s.title, timeLabel: formatTimeLabel(s.date), status: s.status })),
    }
  })
}

export function getCalendarMonthData(year: number, month: number): CalendarMonthData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const { sessions, tasks, projects } = data
  const now = new Date()

  const days = buildGrid(year, month, sessions)

  const upcomingMeetings: CalendarListItem[] = sessions
    .filter((s) => new Date(s.date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6)
    .map((s) => ({ id: s.id, title: s.title, dateLabel: formatDateLabel(s.date), timeLabel: formatTimeLabel(s.date), projectName: projectName(projects, s.projectId) }))

  const todaysAgenda: CalendarListItem[] = sessions
    .filter((s) => sameDay(new Date(s.date), now))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({ id: s.id, title: s.title, dateLabel: formatDateLabel(s.date), timeLabel: formatTimeLabel(s.date), projectName: projectName(projects, s.projectId) }))

  const upcomingDeadlines: CalendarDeadlineItem[] = tasks
    .filter((t) => t.dueDate && t.status !== 'done' && t.status !== 'canceled')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDateLabel: formatDueLabel(t.dueDate) ?? '',
      isOverdue: new Date(t.dueDate!).getTime() < now.getTime(),
    }))

  const recentSessions: CalendarListItem[] = sessions
    .filter((s) => new Date(s.date).getTime() <= now.getTime())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map((s) => ({ id: s.id, title: s.title, dateLabel: formatDateLabel(s.date), timeLabel: formatTimeLabel(s.date), projectName: projectName(projects, s.projectId) }))

  return {
    monthLabel: firstOfMonthLabel(year, month),
    days,
    upcomingMeetings,
    todaysAgenda,
    upcomingDeadlines,
    recentSessions,
  }
}

function firstOfMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
