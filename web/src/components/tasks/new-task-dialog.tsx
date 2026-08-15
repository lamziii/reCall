import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FormField, Input, Select } from '@/components/forms'
import { useToast } from '@/components/feedback/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { isLiveMode } from '@/data/live/data-mode'
import { createManualTask } from '@/data/live/live-store'
import type { LiveTaskDoc } from '@/data/live/types'

const PRIORITY_OPTIONS = [
  { value: 'amber', label: 'Normal' },
  { value: 'red', label: 'Urgent' },
  { value: 'gray', label: 'Low' },
]

export interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Minimal real task creation — persists to the same `tasks` collection as extracted tasks. */
export function NewTaskDialog({ open, onOpenChange }: NewTaskDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<LiveTaskDoc['priority']>('amber')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setDeadline('')
    setPriority('amber')
    setError(null)
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Give the task a title.')
      return
    }
    if (!isLiveMode) {
      toast({ title: 'Sign in to create tasks', description: 'Task creation needs your account.', variant: 'warning' })
      return
    }
    setSaving(true)
    try {
      await createManualTask({ workspaceId, title, deadline: deadline || null, priority, createdBy: user?.id ?? 'unknown' })
      toast({ title: 'Task created', variant: 'success' })
      reset()
      onOpenChange(false)
    } catch {
      setError("Couldn't create the task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : (reset(), onOpenChange(false)))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          {error && <p className="text-small text-danger">{error}</p>}
          <FormField label="Title" required>
            {(f) => <Input {...f} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Send the proposal to the client" autoFocus />}
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Due date" optional>
              {(f) => <Input {...f} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />}
            </FormField>
            <FormField label="Priority">
              {(f) => <Select {...f} value={priority} onChange={(e) => setPriority(e.target.value as LiveTaskDoc['priority'])} options={PRIORITY_OPTIONS} />}
            </FormField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={saving}>
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
