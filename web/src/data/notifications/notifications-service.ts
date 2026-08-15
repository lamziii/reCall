import { getWorkspaceData, saveWorkspaceData } from '../workspace-repository'
import type { Notification, WorkspaceData } from '../types'
import { formatRelativeTime } from '../home/format'
import { isToday } from '../sample/date-helpers'
import type { NotificationGroupKey, NotificationListItem, NotificationsListData } from './types'

function isYesterday(iso: string): boolean {
  const d = new Date(iso)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

function groupFor(iso: string): NotificationGroupKey {
  if (isToday(iso)) return 'today'
  if (isYesterday(iso)) return 'yesterday'
  return 'earlier'
}

function hrefFor(notification: Notification, data: WorkspaceData): string | undefined {
  if (!notification.refType || !notification.refId) return undefined
  switch (notification.refType) {
    case 'session':
      return `/app/sessions/${notification.refId}`
    case 'project':
      return `/app/projects/${notification.refId}`
    case 'task':
      return '/app/tasks'
    case 'decision': {
      const decision = data.decisions.find((d) => d.id === notification.refId)
      return decision?.sourceSessionId ? `/app/sessions/${decision.sourceSessionId}` : undefined
    }
    default:
      return undefined
  }
}

function toListItem(notification: Notification, data: WorkspaceData): NotificationListItem {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    description: notification.description,
    relativeTimeLabel: formatRelativeTime(notification.timestamp),
    read: notification.read,
    href: hrefFor(notification, data),
    group: groupFor(notification.timestamp),
  }
}

export function getNotificationsListData(): NotificationsListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const sorted = [...data.notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return {
    items: sorted.map((n) => toListItem(n, data)),
    unreadCount: sorted.filter((n) => !n.read).length,
  }
}

export function markNotificationRead(notificationId: string): NotificationsListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated: WorkspaceData = { ...data, notifications: data.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)) }
  saveWorkspaceData(updated)
  return getNotificationsListData()
}

export function markAllNotificationsRead(): NotificationsListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated: WorkspaceData = { ...data, notifications: data.notifications.map((n) => ({ ...n, read: true })) }
  saveWorkspaceData(updated)
  return getNotificationsListData()
}
