'use client'

/**
 * Create-project dialog — the real entry point for making a Project (the old buttons were demo
 * placeholders). Writes to the live `projects` store (workspace-scoped, owned by the current user),
 * then navigates to the new project. Kept intentionally small: name + type + optional description;
 * logo/banner/tech-stack are edited later on the project page.
 */
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { FormField } from '@/components/forms/form-field'
import { Input } from '@/components/forms/input'
import { Select } from '@/components/forms/select'
import { Textarea } from '@/components/forms/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'
import { useWorkspace } from '@/data/live/workspace-context'
import { useAuth } from '@/lib/auth/auth-context'
import { useNavigate } from '@/lib/router-compat'
import { createProject } from '@/data/live/projects-store'
import type { ProjectType } from '@/data/live/types'

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'software', label: 'Software' },
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'client', label: 'Client' },
  { value: 'other', label: 'Other' },
]

export function ProjectCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState<ProjectType>('general')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  function reset() {
    setName('')
    setType('general')
    setDescription('')
    setBusy(false)
  }

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const id = await createProject({
        workspaceId,
        ownerId: user?.id ?? 'unknown',
        name: trimmed,
        type,
        description: description.trim() || null,
      })
      onOpenChange(false)
      reset()
      navigate(`/app/projects/${id}`)
    } catch {
      setBusy(false)
      toast({ title: "Couldn't create the project", description: 'Please try again.', variant: 'danger' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Projects organize sessions, notes, and tasks into long-term work.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FormField label="Project name">
            {(f) => (
              <Input
                {...f}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Recall"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
              />
            )}
          </FormField>

          <FormField label="Type">
            {(f) => <Select {...f} value={type} onChange={(e) => setType(e.target.value as ProjectType)} options={TYPE_OPTIONS} />}
          </FormField>

          <FormField label="Description" optional>
            {(f) => <Textarea {...f} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this project about?" />}
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || busy}>{busy ? 'Creating…' : 'Create project'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
