import type { NotificationType } from '../types'

export type NotificationGroupKey = 'today' | 'yesterday' | 'earlier'

export interface NotificationListItem {
  id: string
  type: NotificationType
  title: string
  description: string
  relativeTimeLabel: string
  read: boolean
  href?: string
  group: NotificationGroupKey
}

export interface NotificationsListData {
  items: NotificationListItem[]
  unreadCount: number
}
