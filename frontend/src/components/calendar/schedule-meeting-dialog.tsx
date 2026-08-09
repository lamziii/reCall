import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormField, Input, Select } from '@/components/forms'
import { TimePicker } from '@/components/data-display/time-picker'
import { useToast } from '@/components/feedback/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { isLiveMode } from '@/data/live/data-mode'
import { scheduleSession } from '@/data/live/live-store'

const REMINDER_OPTIONS = [
  { value: '0', label: 'No reminder' },
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
]

function todayDateInput(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Schedules a future meeting (a 'scheduled' session with no transcript yet) so it appears on the
 *  Calendar and fires an in-app reminder before it starts (see data/calendar/use-meeting-reminders). */
export function ScheduleMeetingDialog({ open, onOpenChange }: ScheduleMeetingDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayDateInput())
  const [time, setTime] = useState('10:00')
  const [participants, setParticipants] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState('10')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setDate(todayDateInput())
    setTime('10:00')
    setParticipants('')
    setMeetingLink('')
    setReminderMinutes('10')
    setError(null)
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Give the meeting a title.')
      return
    }
    if (!date || !time) {
      setError('Pick a date and time.')
      return
    }
    const scheduledAt = new Date(`${date}T${time}`)
    if (Number.isNaN(scheduledAt.getTime())) {
      setError('That date and time look invalid.')
      return
    }
    if (!isLiveMode) {
      toast({ title: 'Sign in to schedule meetings', description: 'Scheduling needs your account.', variant: 'warning' })
      return
    }
    setSaving(true)
    setError(null)
    try {
      await scheduleSession({
        workspaceId,
        title: title.trim(),
        scheduledAt,
        participants: participants.split(',').map((p) => p.trim()).filter(Boolean),
        meetingLink: meetingLink.trim() || null,
        reminderMinutesBefore: Number(reminderMinutes),
        createdBy: user?.id ?? 'unknown',
      })
      toast({ title: 'Meeting scheduled', description: `You'll get a reminder before it starts.`, variant: 'success' })
      reset()
      onOpenChange(false)
    } catch {
      setError("Couldn't schedule the meeting. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : (reset(), onOpenChange(false)))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule meeting</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          {error && <p className="text-small text-danger">{error}</p>}
          <FormField label="Title" required>
            {(f) => <Input {...f} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly sync with the design team" autoFocus />}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required>
              {(f) => <Input {...f} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
            </FormField>
            <FormField label="Time" required>
              {(f) => <TimePicker {...f} value={time} onChange={(e) => setTime(e.target.value)} />}
            </FormField>
          </div>
          <FormField label="Participants" optional description="Comma separated names">
            {(f) => <Input {...f} value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Ana, Besnik, Dua" />}
          </FormField>
          <FormField label="Meeting link" optional>
            {(f) => <Input {...f} type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />}
          </FormField>
          <FormField label="Reminder">
            {(f) => <Select {...f} value={reminderMinutes} onChange={(e) => setReminderMinutes(e.target.value)} options={REMINDER_OPTIONS} />}
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={saving}>
            Schedule meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
