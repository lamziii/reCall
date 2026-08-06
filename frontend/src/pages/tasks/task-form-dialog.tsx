import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox, FormField, Input, Select, Textarea } from '@/components/forms'
import { Caption } from '@/components/typography'
import {
  DEV_CATEGORIES,
  DEV_CATEGORY_LABELS,
  DEV_PRIORITIES,
  DEV_PRIORITY_LABELS,
  type DevCategory,
  type DevPriority,
  type DevTaskInput,
  type DevelopmentTask,
} from '@/data/dev-tasks/types'

const CATEGORY_OPTIONS = DEV_CATEGORIES.map((c) => ({ value: c, label: DEV_CATEGORY_LABELS[c] }))
const PRIORITY_OPTIONS = DEV_PRIORITIES.map((p) => ({ value: p, label: DEV_PRIORITY_LABELS[p] }))

export interface TaskFormSubmit {
  input: DevTaskInput
  assignToMe: boolean
  startNow: boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present ⇒ edit mode; absent ⇒ create mode. */
  task?: DevelopmentTask | null
  onSubmit: (payload: TaskFormSubmit) => Promise<void>
}

/** Minimal create/edit modal. Title required; assign/start options only in create mode. */
export function TaskFormDialog({ open, onOpenChange, task, onSubmit }: Props) {
  const isEdit = Boolean(task)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<DevCategory>('other')
  const [priority, setPriority] = useState<DevPriority>('medium')
  const [assignToMe, setAssignToMe] = useState(false)
  const [startNow, setStartNow] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset the form each time the dialog opens (with the task's values in edit mode).
  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setCategory(task?.category ?? 'other')
    setPriority(task?.priority ?? 'medium')
    setAssignToMe(false)
    setStartNow(false)
    setTitleError(null)
    setSaveError(null)
  }, [open, task])

  async function handleSubmit() {
    if (!title.trim()) {
      setTitleError('A title is required.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSubmit({
        input: { title: title.trim(), description: description.trim() || null, category, priority },
        assignToMe,
        startNow: startNow && assignToMe,
      })
      onOpenChange(false)
    } catch {
      setSaveError("Couldn't save the task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          <FormField label="Title" error={titleError ?? undefined} required>
            {(field) => (
              <Input
                {...field}
                autoFocus
                placeholder="What needs doing?"
                value={title}
                error={Boolean(titleError)}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setTitleError(null)
                }}
              />
            )}
          </FormField>

          <FormField label="Description" optional>
            {(field) => (
              <Textarea
                {...field}
                rows={3}
                placeholder="Optional context, links, acceptance criteria…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              {(field) => <Select {...field} options={CATEGORY_OPTIONS} value={category} onChange={(e) => setCategory(e.target.value as DevCategory)} />}
            </FormField>
            <FormField label="Priority">
              {(field) => <Select {...field} options={PRIORITY_OPTIONS} value={priority} onChange={(e) => setPriority(e.target.value as DevPriority)} />}
            </FormField>
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-2.5 rounded-lg border border-border-subtle bg-surface p-3">
              <Checkbox checked={assignToMe} onChange={(e) => setAssignToMe(e.target.checked)} label={<span className="text-small text-foreground">Reserve for me</span>} />
              <Checkbox
                checked={startNow}
                disabled={!assignToMe}
                onChange={(e) => setStartNow(e.target.checked)}
                label={<span className="text-small text-foreground">Start it immediately</span>}
              />
            </div>
          )}

          {saveError && <Caption className="text-danger">{saveError}</Caption>}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
