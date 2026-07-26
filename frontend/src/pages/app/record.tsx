import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Mic } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/feedback/error-state'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'
import { useAudioRecorder } from '@/data/recording/use-audio-recorder'
import { useSpeechRecognition } from '@/data/recording/use-speech-recognition'
import { createRecordedSession } from '@/data/recording/create-recorded-session'
import { getWorkspaceData } from '@/data/workspace-repository'
import { AudioVisualizer, LiveTranscript, RecordingControls, RecordingHeader, RecordingSetup } from '@/components/recording'
import type { RecordingSetupValues } from '@/data/recording/recording-types'

const ACTIVE_STATUSES = new Set(['requesting-permission', 'recording', 'paused', 'stopping'])

export function RecordSessionPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const recorder = useAudioRecorder()
  const [setupValues, setSetupValues] = useState<RecordingSetupValues | null>(null)
  const [processing, setProcessing] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  const workspace = getWorkspaceData()
  const isRecordingLike = recorder.status === 'recording' || recorder.status === 'paused'
  const speech = useSpeechRecognition({ active: recorder.status === 'recording', lang: setupValues?.language ?? 'en-US' })

  useEffect(() => {
    if (!isRecordingLike) return
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isRecordingLike])

  async function handleStart(values: RecordingSetupValues) {
    setSetupValues(values)
    await recorder.start()
  }

  function requestLeave() {
    if (ACTIVE_STATUSES.has(recorder.status)) {
      setLeaveDialogOpen(true)
    } else {
      navigate('/app/sessions')
    }
  }

  async function confirmLeaveAndDiscard() {
    await recorder.stop()
    setLeaveDialogOpen(false)
    navigate('/app/sessions')
  }

  async function handleStop() {
    setProcessing(true)
    const result = await recorder.stop()
    try {
      const sessionId = await createRecordedSession({
        title: setupValues?.title || 'Untitled session',
        projectId: setupValues?.projectId,
        language: setupValues?.language ?? 'en-US',
        durationSeconds: result?.durationSeconds ?? recorder.elapsedSeconds,
        segments: speech.segments,
        audioBlob: result?.blob ?? null,
        mimeType: result?.mimeType ?? 'audio/webm',
      })
      navigate(`/app/sessions/${sessionId}`)
    } catch {
      setProcessing(false)
      toast({ title: "Couldn't save the recording", description: 'Please try again.', variant: 'danger' })
    }
  }

  if (!workspace) {
    return (
      <PageContainer>
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<Home />}
            title="No workspace yet"
            description="Generate sample data from Home before recording a session."
            action={
              <Button variant="secondary" onClick={() => navigate('/app')}>
                Go to Home
              </Button>
            }
          />
        </div>
      </PageContainer>
    )
  }

  if (!setupValues || recorder.status === 'idle') {
    return (
      <PageContainer>
        <RecordingSetup projects={workspace.projects} onCancel={() => navigate('/app/sessions')} onStart={handleStart} />
      </PageContainer>
    )
  }

  if (recorder.status === 'error') {
    return (
      <PageContainer>
        <ErrorState
          title="Recording couldn't start"
          description={recorder.errorMessage ?? 'Something went wrong. Please try again.'}
          onRetry={() => handleStart(setupValues)}
          onBack={() => navigate('/app/sessions')}
        />
      </PageContainer>
    )
  }

  if (processing) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center" aria-live="polite">
          <Mic className="size-6 animate-pulse text-subtle-foreground" aria-hidden="true" />
          <p className="text-title font-medium text-foreground">Organizing your conversation…</p>
          <p className="text-small text-muted-foreground">Finalizing audio and creating your session.</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-8">
      <RecordingHeader
        title={setupValues.title}
        status={recorder.status}
        elapsedSeconds={recorder.elapsedSeconds}
        deviceLabel={recorder.deviceLabel}
        onLeave={requestLeave}
      />

      <AudioVisualizer analyser={recorder.analyserNode} active={recorder.status === 'recording'} />

      <RecordingControls status={recorder.status} onPause={recorder.pause} onResume={recorder.resume} onStop={handleStop} />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <LiveTranscript segments={speech.segments} interimText={speech.interimText} isSupported={speech.isSupported} isListening={recorder.status === 'recording'} />
      </div>

      <ConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title="Leave this recording?"
        description="Your current recording will be stopped and may be lost."
        confirmLabel="Leave and discard"
        cancelLabel="Continue recording"
        variant="danger"
        onConfirm={confirmLeaveAndDiscard}
      />
    </PageContainer>
  )
}
