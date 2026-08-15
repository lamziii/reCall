'use client'

import { useState } from 'react'
import { useLocation, useNavigate } from '@/lib/router-compat'
import { FileText, Mic } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { FormField, Input, Select, Textarea } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { H2, Small } from '@/components/typography'
import { ErrorState } from '@/components/feedback/error-state'
import { Alert } from '@/components/feedback'
import { useToast } from '@/components/feedback/toast'
import { NotesNotebook } from '@/components/recording/notes-notebook'
import { useActiveSession } from '@/data/active-session/active-session-context'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { useWorkspacePlan } from '@/data/live/use-workspace-plan'
import { useMonthlyUsageMinutes } from '@/data/live/use-monthly-usage'
import { PLANS } from '@/data/plans'
import { createSession } from '@/data/live/live-store'
import { EXPECTED_LANGUAGE_OPTIONS, loadExpectedLanguages, saveExpectedLanguages, type ExpectedLanguageCode } from '@/data/live/transcription-languages'
import { cn } from '@/lib/utils'

const SESSION_TYPES = ['Meeting', 'Investor Conversation', 'Client Call', 'Interview', 'Brainstorm', 'Personal Note', 'Other']
const TYPE_OPTIONS = SESSION_TYPES.map((t) => ({ value: t, label: t }))

type Step = 'info' | 'import'

export function LiveRecordSessionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const session = useActiveSession()
  const plan = useWorkspacePlan()
  const usedMinutes = useMonthlyUsageMinutes()
  const limitMinutes = PLANS[plan].maxHoursPerMonth * 60
  const overLimit = usedMinutes >= limitMinutes

  const [step, setStep] = useState<Step>((location.state as { import?: boolean } | null)?.import ? 'import' : 'info')
  const [title, setTitle] = useState('')
  const [sessionType, setSessionType] = useState('Meeting')
  const [project, setProject] = useState('')
  const [participants, setParticipants] = useState('')
  const [notes, setNotes] = useState('')
  const [importText, setImportText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [expectedLanguages, setExpectedLanguages] = useState<ExpectedLanguageCode[]>(loadExpectedLanguages)

  function toggleLanguage(code: ExpectedLanguageCode) {
    setExpectedLanguages((prev) =>
      prev.includes(code) ? (prev.length > 1 ? prev.filter((c) => c !== code) : prev) : [...prev, code],
    )
  }

  function parsedParticipants() {
    return participants.split(',').map((p) => p.trim()).filter(Boolean)
  }

  async function handleStartSession() {
    if (overLimit) return
    setError(null)
    saveExpectedLanguages(expectedLanguages)
    await session.start({
      title: title.trim(),
      sessionType,
      projectName: project.trim() || null,
      participants: parsedParticipants(),
      preNotes: notes.trim() || null,
      expectedLanguages,
    })
  }

  async function handleImportCreate() {
    if (importText.trim().length < 20) {
      setError('Paste a transcript (at least a couple of sentences) to analyze.')
      return
    }
    setError(null)
    setBusy(true)
    saveExpectedLanguages(expectedLanguages)
    try {
      const id = await createSession({
        workspaceId,
        title: title.trim() || 'Imported session',
        sessionType,
        transcript: importText.trim(),
        projectName: project.trim() || null,
        participants: parsedParticipants(),
        notes: notes.trim() || null,
        createdBy: user?.id ?? 'unknown',
        expectedLanguages,
      })
      navigate(`/app/sessions/${id}`, { state: { autostart: true } })
    } catch {
      setBusy(false)
      toast({ title: "Couldn't create the session", description: 'Please try again.', variant: 'danger' })
    }
  }

  // ---- Active recording: the calm My Notes notebook (waveform/status/controls live in the global dock) ----
  if (session.isActive) {
    return (
      <PageContainer className="flex flex-1 flex-col">
        <NotesNotebook />
      </PageContainer>
    )
  }

  // ---- Start failed (mic denied etc.) ----
  if (session.status === 'failed') {
    return (
      <PageContainer>
        <ErrorState
          title="Recording couldn't start"
          description={session.errorMessage ?? 'Something went wrong. Please try again.'}
          onRetry={handleStartSession}
          onBack={() => setStep('info')}
        />
      </PageContainer>
    )
  }

  const infoFields = (
    <div className="flex flex-col gap-4">
      <FormField label="Session title">
        {(f) => <Input {...f} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Investor sync" />}
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Session type">
          {(f) => <Select {...f} value={sessionType} onChange={(e) => setSessionType(e.target.value)} options={TYPE_OPTIONS} />}
        </FormField>
        <FormField label="Project" optional>
          {(f) => <Input {...f} value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Recall" />}
        </FormField>
      </div>
      <FormField label="Participants" optional>
        {(f) => <Input {...f} value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Comma separated names" />}
      </FormField>
      <FormField label="Notes" optional>
        {(f) => <Textarea {...f} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering before you start…" />}
      </FormField>

      <div className="flex flex-col gap-1.5">
        <span className="text-small font-medium text-foreground">Expected meeting languages</span>
        <span className="text-caption text-subtle-foreground">
          Recall prioritizes these when speech is ambiguous, while still preserving other languages you speak.
        </span>
        <div className="mt-1 flex flex-wrap gap-2">
          {EXPECTED_LANGUAGE_OPTIONS.map((opt) => {
            const active = expectedLanguages.includes(opt.code)
            return (
              <button
                key={opt.code}
                type="button"
                aria-pressed={active}
                onClick={() => toggleLanguage(opt.code)}
                className={cn(
                  'focus-ring rounded-full border px-3 py-1 text-small transition-fast',
                  active ? 'border-accent bg-accent-muted text-accent' : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ---- Import Transcript screen (secondary, unchanged AI path) ----
  if (step === 'import') {
    return (
      <PageContainer>
        <PageHeader title="Import a transcript" description="Already have a transcript? Paste it and Recall will organize it into a review." />
        <div className="flex max-w-2xl flex-col gap-5">
          {error && <Small className="text-danger">{error}</Small>}
          {infoFields}
          <FormField label="Transcript">
            {(f) => (
              <Textarea {...f} rows={12} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste the meeting transcript here…" />
            )}
          </FormField>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleImportCreate} loading={busy} disabled={busy}>
              Create session
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setStep('info')}>
              Back
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  // ---- Info / entry screen (default) ----
  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 py-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-accent">
            <Mic className="size-5" />
          </span>
          <H2>Start a new session</H2>
          <Small className="text-muted-foreground">Set up your session, then start recording. Your notes stay with you as you move around Recall.</Small>
        </div>

        {infoFields}

        {overLimit && (
          <Alert
            variant="warning"
            title={`You've used all ${PLANS[plan].maxHoursPerMonth} hrs on ${PLANS[plan].label} this month`}
            description="Upgrade your plan in Settings, or wait until next month to record again."
          />
        )}

        <div className="flex flex-col gap-3">
          <Button leftIcon={<Mic />} onClick={handleStartSession} disabled={overLimit || session.status === 'preparing'} loading={session.status === 'preparing'} fullWidth className="h-[52px]">
            Start Session
          </Button>
          <div className="flex items-center justify-center gap-2 text-small text-muted-foreground">
            <span>Already have a transcript?</span>
            <button type="button" className="focus-ring inline-flex items-center gap-1 rounded-sm font-medium text-foreground hover:underline" onClick={() => setStep('import')}>
              <FileText className="size-3.5" /> Import Transcript
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
