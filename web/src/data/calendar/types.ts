import type { SessionStatusValue } from '@/components/recall/session-status'

export interface CalendarSessionPill {
  id: string
  title: string
  timeLabel: string
  status: SessionStatusValue
}

export interface CalendarDay {
  dateIso: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  sessions: CalendarSessionPill[]
}

export interface CalendarListItem {
  id: string
  title: string
  dateLabel: string
  timeLabel: string
  projectName?: string
}

export interface CalendarDeadlineItem {
  id: string
  title: string
  dueDateLabel: string
  isOverdue: boolean
}

export interface CalendarMonthData {
  monthLabel: string
  days: CalendarDay[]
  upcomingMeetings: CalendarListItem[]
  todaysAgenda: CalendarListItem[]
  upcomingDeadlines: CalendarDeadlineItem[]
  recentSessions: CalendarListItem[]
}
