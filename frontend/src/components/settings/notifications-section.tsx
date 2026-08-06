import { useState } from 'react'
import { Small } from '@/components/typography'
import { useToast } from '@/components/feedback'
import { useNotificationPriority } from '@/data/live/use-notification-priority'
import type { NotificationType } from '@/data/types'
import { NotificationPriorityList } from './notification-priority-list'

export function NotificationsSection() {
  const { toast } = useToast()
  const { order, setOrder } = useNotificationPriority()
  const [saving, setSaving] = useState(false)

  async function handleChange(next: NotificationType[]) {
    setSaving(true)
    try {
      await setOrder(next)
    } catch {
      toast({ title: "Couldn't update notification priority", description: 'Check your connection and try again.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Small className="text-muted-foreground">
        Rank what matters most so the highest-priority activity always surfaces first. Use the arrows to reorder.
      </Small>
      <NotificationPriorityList order={order} onChange={(next) => void handleChange(next)} disabled={saving} />
    </div>
  )
}
