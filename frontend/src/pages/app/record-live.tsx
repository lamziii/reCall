import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText, Mic } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout/page'
import { FormField, Input, Select, Textarea } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { H2, Small } from '@/components/typography'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/feedback/error-state'
import { useToast } from '@/components/feedback/toast'
import { AudioVisualizer, RecordingControls, RecordingHeader } from '@/components/recording'
import { useAudioRecorder } from '@/data/recording/use-audio-recorder'
import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace } from '@/data/live/workspace-context'
import { createSession, setTranscriptionStatus } from '@/data/live/live-store'
import { putLocalAudio } from '@/data/live/local-audio'
import { pipelineLog } from '@/lib/diagnostics'
import { EXPECTED_LANGUAGE_OPTIONS, loadExpectedLanguages, saveExpectedLanguages, type ExpectedLanguageCode } from '@/data/live/transcription-languages'
import { cn } from '@/lib/utils'

const SESSION_TYPES = ['Meeting', 'Investor Conversation', 'Client Call', 'Interview', 'Brainstorm', 'Personal Note', 'Other']
const TYPE_OPTIONS = SESSION_TYPES.map((t) => ({ value: t, label: t }))

type Step = 'info' | 'recording' | 'processing' | 'import'

const ACTIVE_STATUSES = new Set(['requesting-permission', 'recording', 'paused', 'stopping'])

export function LiveRecordSessionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useAuth()
  const { workspaceId } = useWorkspace()
  const recorder = useAudioRecorder()

  const [step, setStep] = useState<Step>((location.state as { import?: boolean } | null)?.import ? 'import' : 'info')
  const [title, setTitle] = useState('')
  const [sessionType, setSessionType] = useState('Meeting')
  const [project, setProject] = useState('')
  const [participants, setParticipants] = useState('')
  const [notes, setNotes] = useState('')
  const [importText, setImportText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [expectedLanguages, setExpectedLanguages] = useState<ExpectedLanguageCode[]>(loadExpectedLanguages)

  // Toggle a language; always keep at least one selected.
  function toggleLanguage(code: ExpectedLanguageCode) {
    setExpectedLanguages((prev) =>
      prev.includes(code) ? (prev.length > 1 ? prev.filter((c) => c !== code) : prev) : [...prev, code],
    )
  }

  // No browser SpeechRecognition: the recording UI shows only mic/waveform/timer, and OpenAI is the
  // sole transcript source (see handleStopAndProcess).
  const isRecordingLike = recorder.status === 'recording' || recorder.status === 'paused'

  // Warn before a refresh/close mid-recording (in-app nav is guarded by the leave dialog).
  useEffect(() => {
    if (!isRecordingLike) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isRecordingLike])

  function parsedParticipants() {
    return participants.split(',').map((p) => p.trim()).filter(Boolean)
  }

  async function handleStartRecording() {
    setError(null)
    saveExpectedLanguages(expectedLanguages) // remember for next session
    const ok = await recorder.start()
    if (ok) setStep('recording')
  }

  function requestLeave() {
    if (ACTIVE_STATUSES.has(recorder.status)) setLeaveOpen(true)
    else navigate('/app/sessions')
  }

  async function confirmLeave() {
    await recorder.stop()
    setLeaveOpen(false)
    navigate('/app/sessions')
  }

  async function handleStopAndProcess() {
    setStep('processing')
    const result = await recorder.stop()
    pipelineLog('record.stop', { hasBlob: Boolean(result?.blob), durationSeconds: result?.durationSeconds })
    try {
      // No browser transcript is captured or stored — OpenAI (gpt-4o-transcribe-diarize) is the ONLY
      // transcript source. Save an empty transcript and mark 'pending'; the review page runs OpenAI on
      // the audio, then Claude. No audio → 'failed' so Claude never runs on an empty transcript.
      const hasAudio = Boolean(result?.blob)
      const id = await createSession({
        workspaceId,
        title: title.trim() || 'Untitled session',
        sessionType,
        transcript: '',
        projectName: project.trim() || null,
        participants: parsedParticipants(),
        notes: notes.trim() || null,
        segments: [],
        speakers: [],
        createdBy: user?.id ?? 'unknown',
        transcriptionStatus: hasAudio ? 'pending' : 'failed',
        expectedLanguages,
      })

      if (result?.blob) {
        // Audio lives in IndexedDB keyed by sessionId (Storage is off for the demo) — this IS the
        // audio location the review page reads to transcribe. Must land before we navigate.
        try {
          await putLocalAudio(id, result.blob)
          pipelineLog('audio.saved', { sessionId: id, bytes: result.blob.size, mime: result.blob.type })
        } catch {
          await setTranscriptionStatus(id, 'failed', {
            error: 'The recording audio could not be saved on this device to transcribe.',
          }).catch(() => {})
          toast({ title: 'Recording audio could not be saved', description: 'Transcription needs the audio — please try again.', variant: 'warning' })
        }
      } else {
        await setTranscriptionStatus(id, 'failed', { error: 'No audio was captured for this recording.' }).catch(() => {})
      }

      // Navigate immediately — no blocking. The review page shows live status while OpenAI runs.
      navigate(`/app/sessions/${id}`)
    } catch {
      setStep('recording')
      toast({ title: "Couldn't save the recording", description: 'Please try again.', variant: 'danger' })
    }
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

  // ---- Recording screen ----
  if (step === 'recording') {
    if (recorder.status === 'error') {
      return (
        <PageContainer>
          <ErrorState
            title="Recording couldn't start"
            description={recorder.errorMessage ?? 'Something went wrong. Please try again.'}
            onRetry={handleStartRecording}
            onBack={() => setStep('info')}
          />
        </PageContainer>
      )
    }
    return (
      <PageContainer className="flex flex-1 flex-col gap-8">
        <RecordingHeader
          title={title || 'Untitled session'}
          status={recorder.status}
          elapsedSeconds={recorder.elapsedSeconds}
          deviceLabel={recorder.deviceLabel}
          onLeave={requestLeave}
        />
        <AudioVisualizer analyser={recorder.analyserNode} active={recorder.status === 'recording'} />
        <RecordingControls
          status={recorder.status}
          onPause={recorder.pause}
          onResume={recorder.resume}
          onStop={handleStopAndProcess}
        />
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-1 text-center">
          <Small className="text-muted-foreground">Recording in progress</Small>
          <Small className="text-subtle-foreground">Your transcript is created automatically after you stop recording.</Small>
        </div>
        <ConfirmDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          title="Leave this recording?"
          description="Your current recording will be stopped and may be lost."
          confirmLabel="Leave and discard"
          cancelLabel="Continue recording"
          variant="danger"
          onConfirm={confirmLeave}
        />
      </PageContainer>
    )
  }

  // ---- Processing screen ----
  if (step === 'processing') {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center" aria-live="polite">
          <Mic className="size-6 animate-pulse text-subtle-foreground" aria-hidden />
          <p className="text-title font-medium text-foreground">Saving your recording…</p>
          <Small className="text-muted-foreground">Opening your session — transcription starts automatically.</Small>
        </div>
      </PageContainer>
    )
  }

  // ---- Shared session-info fields ----
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

  // ---- Import Transcript screen (secondary) ----
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
          <Small className="text-muted-foreground">Set up your session, then start recording.</Small>
        </div>

        {infoFields}

        <div className="flex flex-col gap-3">
          <Button leftIcon={<Mic />} onClick={handleStartRecording} fullWidth className="h-[52px]">
            Start Recording
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
