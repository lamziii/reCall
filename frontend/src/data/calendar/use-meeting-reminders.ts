import { useEffect, useRef } from 'react'
import { useToast } from '@/components/feedback/toast'
import { useWorkspace } from '@/data/live/workspace-context'
import { isDemoMode, isLiveMode } from '@/data/live/data-mode'
import { subscribeSessions } from '@/data/live/live-store'
import { getWorkspaceData } from '@/data/workspace-repository'

const CHECK_INTERVAL_MS = 20_000
const DEFAULT_REMINDER_MINUTES = 10
/** How late a meeting can be before we give up reminding — avoids a burst of stale toasts after the
 *  tab was in the background/closed through a meeting's start time. */
const MAX_LATE_MS = 60_000

interface UpcomingMeeting {
  id: string
  title: string
  startAt: Date
  reminderMinutes: number
}

/**
 * Polls scheduled meetings and fires a one-time in-app toast shortly before each starts. In-app
 * only — this only fires while the tab is open (see the Schedule-meetings feature note: no
 * server-side delivery). Mount once in RecallShell so it runs regardless of the active page.
 */
export function useMeetingReminders(): void {
  const { toast } = useToast()
  const { workspaceId } = useWorkspace()
  const remindedRef = useRef(new Set<string>())

  useEffect(() => {
    let meetings: UpcomingMeeting[] = []

    function fireReminders() {
      const now = Date.now()
      for (const meeting of meetings) {
        if (remindedRef.current.has(meeting.id)) continue
        const msUntilStart = meeting.startAt.getTime() - now
        const reminderWindowMs = meeting.reminderMinutes * 60_000
        if (msUntilStart <= reminderWindowMs && msUntilStart > -MAX_LATE_MS) {
          remindedRef.current.add(meeting.id)
          const minutesLeft = Math.round(msUntilStart / 60_000)
          toast({
            title: `"${meeting.title}" ${minutesLeft <= 0 ? 'is starting now' : `starts in ${minutesLeft} min`}`,
            description: meeting.startAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
            duration: 8000,
          })
        }
      }
    }

    if (isDemoMode) {
      function loadDemoMeetings() {
        const sessions = getWorkspaceData()?.sessions ?? []
        meetings = sessions
          .filter((s) => s.status === 'scheduled')
          .map((s) => ({ id: s.id, title: s.title, startAt: new Date(s.date), reminderMinutes: s.reminderMinutesBefore ?? DEFAULT_REMINDER_MINUTES }))
      }
      loadDemoMeetings()
      fireReminders()
      const interval = setInterval(() => {
        loadDemoMeetings()
        fireReminders()
      }, CHECK_INTERVAL_MS)
      return () => clearInterval(interval)
    }

    if (!isLiveMode) return
    const unsubscribe = subscribeSessions(
      workspaceId,
      (sessions) => {
        meetings = sessions
          .filter((s) => s.status === 'scheduled' && s.scheduled_at)
          .map((s) => ({
            id: s.id,
            title: s.title?.trim() || 'Untitled meeting',
            startAt: s.scheduled_at!.toDate(),
            reminderMinutes: s.reminder_minutes_before ?? DEFAULT_REMINDER_MINUTES,
          }))
        fireReminders()
      },
      () => {},
    )
    const interval = setInterval(fireReminders, CHECK_INTERVAL_MS)
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [workspaceId, toast])
}
