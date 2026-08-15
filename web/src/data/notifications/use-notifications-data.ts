import { useCallback, useEffect, useState } from 'react'
import { getNotificationsListData, markAllNotificationsRead, markNotificationRead } from './notifications-service'
import type { NotificationsListData } from './types'

export type NotificationsDataState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; data: NotificationsListData }

export function useNotificationsData() {
  const [state, setState] = useState<NotificationsDataState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    try {
      const data = getNotificationsListData()
      window.setTimeout(() => {
        setState(data && data.items.length > 0 ? { status: 'success', data } : { status: 'empty' })
      }, 200)
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const markRead = useCallback((notificationId: string) => {
    const data = markNotificationRead(notificationId)
    if (data) setState({ status: 'success', data })
  }, [])

  const markAllRead = useCallback(() => {
    const data = markAllNotificationsRead()
    if (data) setState({ status: 'success', data })
  }, [])

  return { state, refetch: load, markRead, markAllRead }
}
