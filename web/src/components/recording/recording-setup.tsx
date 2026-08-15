import { useState } from 'react'
import { Mic } from 'lucide-react'
import { FormField } from '@/components/forms/form-field'
import { Input } from '@/components/forms/input'
import { Select } from '@/components/forms/select'
import { Textarea } from '@/components/forms/textarea'
import { Button } from '@/components/ui/button'
import { InlineError } from '@/components/feedback/inline-error'
import { H2, Small } from '@/components/typography'
import type { RecordingSetupValues } from '@/data/recording/recording-types'

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
]

function defaultLanguage(): string {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
  return LANGUAGE_OPTIONS.some((opt) => opt.value === nav) ? nav : LANGUAGE_OPTIONS.some((opt) => opt.value.startsWith(nav.slice(0, 2))) ? LANGUAGE_OPTIONS.find((opt) => opt.value.startsWith(nav.slice(0, 2)))!.value : 'en-US'
}

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  )
}

export interface RecordingSetupProps {
  projects: { id: string; name: string }[]
  onCancel: () => void
  onStart: (values: RecordingSetupValues) => void
}

export function RecordingSetup({ projects, onCancel, onStart }: RecordingSetupProps) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [language, setLanguage] = useState(defaultLanguage)
  const [notes, setNotes] = useState('')
  const supported = isRecordingSupported()

  function handleStart() {
    onStart({ title: title.trim() || 'Untitled session', projectId, language, notes })
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-accent">
          <Mic className="size-5" />
        </span>
        <H2>New recording</H2>
        <Small className="text-muted-foreground">Set up your session before you start recording.</Small>
      </div>

      <div className="flex flex-col gap-4">
        <FormField label="Session title">
          {(f) => <Input {...f} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled session" />}
        </FormField>

        <FormField label="Related project" optional>
          {(f) => (
            <Select
              {...f}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="No project"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          )}
        </FormField>

        <FormField label="Language">
          {(f) => <Select {...f} value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGE_OPTIONS} />}
        </FormField>

        <FormField label="Notes" optional>
          {(f) => <Textarea {...f} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything worth remembering before you start…" />}
        </FormField>
      </div>

      {!supported && (
        <InlineError>Audio recording is not supported in this browser. Try the latest version of Chrome, Edge, or Safari.</InlineError>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button leftIcon={<Mic />} onClick={handleStart} disabled={!supported}>
          Start recording
        </Button>
      </div>
    </div>
  )
}
