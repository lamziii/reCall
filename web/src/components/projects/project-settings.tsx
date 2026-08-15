import { useState } from 'react'
import { FormField } from '@/components/forms/form-field'
import { Input } from '@/components/forms/input'
import { Textarea } from '@/components/forms/textarea'
import { Select } from '@/components/forms/select'
import { Button } from '@/components/ui/button'
import { Divider } from '@/components/data-display/divider'
import { H3, Small } from '@/components/typography'
import { useToast } from '@/components/feedback/toast'
import type { ProjectDetailData } from '@/data/projects/types'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'at-risk', label: 'At risk' },
  { value: 'on-hold', label: 'On hold' },
  { value: 'done', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export function ProjectSettings({ project }: { project: ProjectDetailData }) {
  const { toast } = useToast()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [status, setStatus] = useState(project.status)

  function handleSave() {
    toast({ title: 'Settings saved', description: "This is mocked for the demo — changes aren't persisted yet.", variant: 'success' })
  }

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <FormField label="Project name">{(f) => <Input {...f} value={name} onChange={(e) => setName(e.target.value)} />}</FormField>
      <FormField label="Description">
        {(f) => <Textarea {...f} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />}
      </FormField>
      <FormField label="Status">
        {(f) => <Select {...f} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} options={STATUS_OPTIONS} />}
      </FormField>
      <div>
        <Button onClick={handleSave}>Save changes</Button>
      </div>

      <Divider className="my-2" />

      <div className="flex flex-col gap-2">
        <H3>Danger zone</H3>
        <Small className="text-muted-foreground">Archiving hides this project from active views without deleting its data.</Small>
        <div>
          <Button variant="secondary" onClick={() => toast({ title: 'Project archived', description: 'This is mocked for the demo.' })}>
            Archive project
          </Button>
        </div>
      </div>
    </div>
  )
}
