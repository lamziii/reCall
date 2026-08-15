import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from '@/lib/router-compat'
import { AlertTriangle, Check, ListChecks, Loader2, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { PageContainer } from '@/components/layout/page'
import { Tab, TabList, TabPanel, Tabs } from '@/components/navigation/tabs'
import { Skeleton } from '@/components/feedback/skeleton'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/data-display/badge'
import { Input } from '@/components/forms'
import { useToast } from '@/components/feedback/toast'
import { Body, Caption, Small } from '@/components/typography'
import { PriorityBadge } from '@/components/data-display/priority-badge'
import { SessionHeader, SessionOverview } from '@/components/sessions'
import { SessionNotesTab } from '@/components/sessions/session-notes-tab'
import { useLiveSessionReview } from '@/data/sessions/use-live-session-review'
import { useLiveTranscription } from '@/data/sessions/use-live-transcription'
import { promoteCandidateTask, saveSpeakerMapping } from '@/data/live/live-store'
import { requestSessionReview, ExtractReviewError } from '@/lib/firebase/functions'
import { pipelineLog } from '@/lib/diagnostics'
import { priorityDbToView, toHeaderData, liveReviewToDetailData } from '@/data/live/mappers'
import type { TaskStatusValue } from '@/components/recall/task-status'
import { useLiveAudioUrl } from '@/data/live/use-live-audio-url'
import { formatDueLabel } from '@/data/home/format'
import { useWorkspace } from '@/data/live/workspace-context'
import type { CandidateTask } from '@/data/live/review'
import type { SessionSpeaker, TranscriptSegment } from '@/data/live/types'

const PROCESSING_STAGES = [
  'Saving session',
  'Reading the transcript',
  'Identifying decisions and actions',
  'Organizing the Session Review',
  'Finalizing workspace items',
]

function ProcessingPanel() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-20 text-center" aria-live="polite">
      <Sparkles className="size-6 animate-pulse text-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-title font-medium text-foreground">Organizing this session…</p>
        <Small className="text-muted-foreground">Recall is reading the transcript and structuring the review.</Small>
      </div>
      <ul className="flex w-full flex-col gap-2 text-left">
        {PROCESSING_STAGES.map((stage) => (
          <li key={stage} className="flex items-center gap-2 text-small text-muted-foreground">
            <span className="size-1.5 rounded-full bg-surface-active" aria-hidden />
            {stage}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EvidenceNote({ text }: { text: string | null }) {
  if (!text) return null
  return <Small className="border-l-2 border-border-subtle pl-3 text-subtle-foreground italic">“{text}”</Small>
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** While OpenAI runs: temporary live captions + the spec's staged status wording. When the doc
 *  says 'processing' but no tab is driving it (stalled), offer a manual retry. */
function TranscriptionStatusPanel({
  stageLabel,
  progressPercent,
  tempTranscript,
  stalled,
  onRetry,
}: {
  stageLabel: string | null
  progressPercent: number | null
  tempTranscript: string
  stalled: boolean
  onRetry: () => void
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-16 text-center" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-title font-medium text-foreground">
          {stageLabel ?? 'Transcribing…'}
          {progressPercent !== null && <span className="ml-2 tabular-nums text-muted-foreground">{progressPercent}%</span>}
        </p>
        <Small className="text-muted-foreground">
          Recall is transcribing the recording with OpenAI. The live captions below are temporary and will be replaced.
        </Small>
      </div>
      {tempTranscript && (
        <div className="w-full rounded-lg border border-border-subtle bg-surface p-4 text-left">
          <Caption className="text-subtle-foreground">Temporary live transcript</Caption>
          <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-small leading-relaxed text-muted-foreground">{tempTranscript}</p>
        </div>
      )}
      {stalled && (
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw />} onClick={onRetry}>
          Taking too long? Retry transcription
        </Button>
      )}
    </div>
  )
}

/** OpenAI failed: keep the temporary transcript out of Claude; offer a retry. */
function TranscriptionFailedPanel({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
      <AlertTriangle className="size-6 text-danger" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-title font-medium text-foreground">OpenAI transcription failed</p>
        <Small className="text-muted-foreground">{error ?? "We couldn't transcribe this recording. Your audio is saved."}</Small>
      </div>
      <Button leftIcon={<RefreshCw />} onClick={onRetry}>
        Retry transcription
      </Button>
    </div>
  )
}

/** Speaker-labeled transcript with per-turn timestamps (shown once OpenAI segments exist). */
function LabeledTranscript({ segments, speakers, plain }: { segments: TranscriptSegment[]; speakers: SessionSpeaker[]; plain: string }) {
  if (!segments.length) {
    return (
      <div className="whitespace-pre-wrap rounded-lg border border-border-subtle bg-surface p-4 text-small leading-relaxed text-foreground">
        {plain || 'No transcript on file for this session.'}
      </div>
    )
  }
  const byLabel = new Map(speakers.map((s) => [s.label, s.displayName?.trim() || s.label]))
  // Merge consecutive same-speaker turns, keeping the first turn's start time.
  const lines: { label: string; startMs: number; text: string }[] = []
  for (const seg of segments) {
    const label = byLabel.get(seg.speakerLabel) || seg.speakerLabel || 'Speaker'
    const last = lines[lines.length - 1]
    if (last && last.label === label) last.text += ` ${seg.text}`
    else lines.push({ label, startMs: seg.startMs, text: seg.text })
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface p-4">
      {lines.map((line, i) => (
        <div key={i} className="flex flex-col gap-0.5 text-small leading-relaxed">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-accent">{line.label}</span>
            <Caption className="text-subtle-foreground tabular-nums">{mmss(line.startMs)}</Caption>
          </div>
          <span className="whitespace-pre-wrap text-foreground">{line.text}</span>
        </div>
      ))}
    </div>
  )
}

export function LiveSessionReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { workspaceId } = useWorkspace()
  const { status, session, review, promotedIndices } = useLiveSessionReview(sessionId)
  const transcription = useLiveTranscription(sessionId, session)

  // Transcription lifecycle gates. Claude must NEVER run on a browser transcript, so we only treat
  // a session as "ready to analyze" when OpenAI is complete, or it's an imported/legacy transcript.
  const tStatus = session?.transcription_status
  const transcriptionInProgress = tStatus === 'pending' || tStatus === 'processing'
  const transcriptionFailed = tStatus === 'failed'
  const transcriptionReady = tStatus === undefined || tStatus === 'none' || tStatus === 'complete'

  const [tab, setTab] = useState('overview')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [promoting, setPromoting] = useState<Set<number>>(new Set())

  // Editable local copy of the speaker mapping, seeded from the session doc.
  const [speakers, setSpeakers] = useState<SessionSpeaker[]>([])
  const speakersSeeded = useRef(false)
  useEffect(() => {
    if (!speakersSeeded.current && session?.speakers?.length) {
      setSpeakers(session.speakers)
      speakersSeeded.current = true
    }
  }, [session?.speakers])

  const isProcessing = generating || session?.review_status === 'processing'
  const headerData = useMemo(
    () => (session ? toHeaderData(session, review?.executive_summary ?? '') : null),
    [session, review],
  )

  // Ephemeral task-status edits for the Overview's task list (AI candidates have no persisted
  // board status; this keeps the dropdown responsive within the page without a fake write).
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatusValue>>({})
  const detailData = useMemo(() => {
    if (!session || !review) return null
    const d = liveReviewToDetailData(session, review)
    return { ...d, tasks: d.tasks.map((t) => (taskStatuses[t.id] ? { ...t, status: taskStatuses[t.id] } : t)) }
  }, [session, review, taskStatuses])

  const audioUrl = useLiveAudioUrl(sessionId, session?.recording_url)

  async function handleGenerate() {
    if (!sessionId || !session || isProcessing) return
    // Never send a temporary browser transcript to Claude — only OpenAI/imported transcripts.
    if (!transcriptionReady) {
      toast({
        title: 'Transcription not ready',
        description: 'Wait for OpenAI to finish (or retry it) before analyzing this session.',
        variant: 'warning',
      })
      return
    }
    if (!session.transcript || session.transcript.trim().length < 20) {
      toast({ title: 'No transcript to analyze', description: 'Add a transcript to this session first.', variant: 'danger' })
      return
    }
    setGenerateError(null)
    setGenerating(true)
    pipelineLog('claude.start', { sessionId, transcriptionStatus: tStatus, provider: session.transcription_provider })
    try {
      await requestSessionReview(sessionId, session.transcript, {
        segments: session.segments,
        speakers: speakers.length ? speakers : session.speakers,
      })
      toast({ title: 'Session review ready', variant: 'success' })
    } catch (err) {
      const message =
        err instanceof ExtractReviewError
          ? err.message
          : 'Recall could not organize this session. Your transcript is saved — please try again.'
      setGenerateError(message)
    } finally {
      setGenerating(false)
    }
  }

  // Auto-start Claude ONCE the transcript is final: OpenAI 'complete' (recorded path) or an
  // imported transcript arriving with state.autostart. Never for a pending/processing/failed
  // recording — that would feed Claude the temporary browser transcript. Refresh-safe: when the
  // backend flips transcription_status to 'complete', this effect re-runs and fires.
  const autostartedRef = useRef(false)
  useEffect(() => {
    if (autostartedRef.current) return
    if (status !== 'ready' || !session || review || generating) return
    if (session.review_status === 'processing' || session.review_status === 'failed') return
    if ((session.transcript?.trim().length ?? 0) < 20) return

    const importArrival = Boolean((location.state as { autostart?: boolean } | null)?.autostart)
    const openaiComplete = session.transcription_status === 'complete'
    // Legacy/imported ('none'/undefined) only auto-runs when the user just arrived to analyze.
    const ready = openaiComplete || (transcriptionReady && importArrival)
    if (!ready) return

    autostartedRef.current = true
    void handleGenerate()
  }, [status, session, review, generating, location.state, transcriptionReady])

  // Diagnostics: mark when Claude's review lands.
  const reviewLoggedRef = useRef(false)
  useEffect(() => {
    if (review && !reviewLoggedRef.current) {
      reviewLoggedRef.current = true
      pipelineLog('claude.done', { sessionId, tasks: review.tasks?.length ?? 0 })
    }
  }, [review, sessionId])

  async function handleSaveSpeakers() {
    if (!sessionId) return
    try {
      await saveSpeakerMapping(sessionId, speakers)
      toast({ title: 'Speaker names saved', variant: 'success' })
      if (review) void handleGenerate() // re-analyze with the new names when a review already exists
    } catch {
      toast({ title: "Couldn't save speaker names", description: 'Please try again.', variant: 'danger' })
    }
  }

  function setSpeakerName(id: string, displayName: string) {
    setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, displayName: displayName || null } : s)))
  }

  async function handlePromote(index: number, candidate: CandidateTask) {
    if (!sessionId || !review || promotedIndices.has(index) || promoting.has(index)) return
    setPromoting((prev) => new Set(prev).add(index))
    try {
      await promoteCandidateTask({
        workspaceId,
        sessionId,
        reviewId: review.id,
        candidateIndex: index,
        candidate,
      })
      toast({ title: 'Added to Tasks', description: candidate.title, variant: 'success' })
    } catch {
      toast({ title: "Couldn't add that task", description: 'Please try again.', variant: 'danger' })
    } finally {
      setPromoting((prev) => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }
  }

  if (status === 'loading') {
    return (
      <PageContainer>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-96 max-w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    )
  }

  if (status === 'error') {
    return (
      <PageContainer>
        <ErrorState title="We couldn't load this session" onBack={() => navigate('/app/sessions')} />
      </PageContainer>
    )
  }

  if (status === 'not-found' || !session || !headerData) {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertTriangle />}
          title="Session not found"
          description="This session may have been removed, or the link is incorrect."
          action={
            <Button variant="secondary" onClick={() => navigate('/app/sessions')}>
              Back to Sessions
            </Button>
          }
          className="flex-1 py-24"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <SessionHeader session={headerData} />

      {transcriptionInProgress ? (
        <TranscriptionStatusPanel
          stageLabel={transcription.stageLabel}
          progressPercent={transcription.progressPercent}
          tempTranscript={session.transcript ?? ''}
          stalled={tStatus === 'processing' && !transcription.active}
          onRetry={transcription.retry}
        />
      ) : transcriptionFailed ? (
        <TranscriptionFailedPanel error={session.transcription_error ?? null} onRetry={transcription.retry} />
      ) : isProcessing ? (
        <ProcessingPanel />
      ) : !review ? (
        // No review yet — generate, or show the failure + retry.
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-16 text-center">
          {session.review_status === 'failed' || generateError ? (
            <>
              <AlertTriangle className="size-6 text-danger" aria-hidden />
              <div className="flex flex-col gap-1">
                <p className="text-title font-medium text-foreground">Recall couldn't organize this session</p>
                <Small className="text-muted-foreground">{generateError ?? 'Your transcript is saved — please try again.'}</Small>
              </div>
              <Button leftIcon={<RefreshCw />} onClick={handleGenerate}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <Sparkles className="size-6 text-foreground" aria-hidden />
              <div className="flex flex-col gap-1">
                <p className="text-title font-medium text-foreground">Ready to analyze this session</p>
                <Small className="text-muted-foreground">Generate an AI Session Review from the transcript.</Small>
              </div>
              <Button leftIcon={<Sparkles />} onClick={handleGenerate}>
                Generate Review
              </Button>
            </>
          )}
        </div>
      ) : (
        <Tabs value={tab} defaultValue="overview" onValueChange={setTab}>
          <TabList className="overflow-x-auto">
            <Tab value="overview">Overview</Tab>
            <Tab value="tasks">Tasks</Tab>
            <Tab value="decisions">Decisions</Tab>
            <Tab value="transcript">Transcript</Tab>
            <Tab value="notes">Notes</Tab>
          </TabList>

          {/* Overview: the same polished, clearly-sectioned layout the demo uses (decisions /
              tasks / open questions / risks & insights), mapped from the live AI review. */}
          <TabPanel value="overview" className="py-6">
            {detailData && (
              <SessionOverview
                session={detailData}
                onApproveDecision={() => {}}
                onRejectDecision={() => {}}
                onTaskStatusChange={(id, status) => setTaskStatuses((prev) => ({ ...prev, [id]: status }))}
                onTimelineClick={() => setTab('transcript')}
              />
            )}
          </TabPanel>

          {/* Tasks: AI candidates with Promote-to-board action */}
          <TabPanel value="tasks" className="py-6">
            {review.tasks.length === 0 ? (
              <EmptyState icon={<ListChecks />} title="No action items found" description="Recall didn't extract any tasks from this session." />
            ) : (
              <div className="flex flex-col gap-3">
                {review.tasks.map((candidate, i) => {
                  const added = promotedIndices.has(i)
                  const busy = promoting.has(i)
                  return (
                    <div key={i} className="flex items-start justify-between gap-4 rounded-lg border border-border-subtle p-4">
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <Body className="font-medium text-foreground">{candidate.title}</Body>
                        <div className="flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={priorityDbToView(candidate.priority)} />
                          <Caption className="text-subtle-foreground">{candidate.owner ?? 'Unassigned'}</Caption>
                          <Caption className="text-subtle-foreground">{formatDueLabel(candidate.deadline ?? undefined)}</Caption>
                        </div>
                        <EvidenceNote text={candidate.evidence} />
                      </div>
                      <Button
                        variant={added ? 'ghost' : 'secondary'}
                        size="sm"
                        disabled={added || busy}
                        loading={busy}
                        leftIcon={added ? <Check /> : <Plus />}
                        onClick={() => handlePromote(i, candidate)}
                      >
                        {added ? 'Added' : 'Add to Tasks'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </TabPanel>

          {/* Decisions */}
          <TabPanel value="decisions" className="py-6">
            {review.decisions.length === 0 ? (
              <EmptyState icon={<ListChecks />} title="No decisions recorded" description="Recall didn't find any decisions in this session." />
            ) : (
              <div className="flex flex-col gap-4">
                {review.decisions.map((d, i) => (
                  <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border-subtle p-4">
                    <Body className="font-medium text-foreground">{d.decision}</Body>
                    {d.details && <Small className="text-muted-foreground">{d.details}</Small>}
                    <EvidenceNote text={d.evidence} />
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Transcript: audio playback + speaker mapping + labeled transcript */}
          <TabPanel value="transcript" className="flex flex-col gap-6 py-6">
            {audioUrl && (
              <div className="flex flex-col gap-2">
                <Caption className="text-subtle-foreground">Recording</Caption>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio controls src={audioUrl} className="w-full max-w-xl" />
              </div>
            )}

            {speakers.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-border-subtle p-4">
                <div className="flex flex-col gap-0.5">
                  <Body className="font-medium text-foreground">Speakers</Body>
                  <Small className="text-muted-foreground">
                    Map the detected speakers to real names to sharpen the review.
                  </Small>
                </div>
                <div className="flex flex-col gap-2">
                  {speakers.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <Caption className="w-20 shrink-0 text-subtle-foreground">{s.label}</Caption>
                      <Input
                        value={s.displayName ?? ''}
                        placeholder="Add a name (optional)"
                        onChange={(e) => setSpeakerName(s.id, e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Button size="sm" variant="secondary" onClick={handleSaveSpeakers} disabled={isProcessing}>
                    {review ? 'Save & re-analyze' : 'Save names'}
                  </Button>
                </div>
              </div>
            )}

            {tStatus === 'complete' && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" icon={<Check />}>Processing complete</Badge>
                <Badge variant="outline">Provider: {session.transcription_provider ?? 'openai'}</Badge>
                <Badge variant="outline">Model: {session.transcription_model ?? '—'}</Badge>
                {session.detected_language && <Badge variant="outline">Language: {session.detected_language}</Badge>}
              </div>
            )}

            <LabeledTranscript
              segments={session.segments ?? []}
              speakers={speakers.length ? speakers : session.speakers ?? []}
              plain={session.transcript ?? ''}
            />
          </TabPanel>

          {/* Notes: the user's OWN notebook from the live meeting — same canonical user_notes field,
              still editable. Distinct from the AI-generated review above. */}
          <TabPanel value="notes" className="py-6">
            <SessionNotesTab sessionId={sessionId!} workspaceId={workspaceId} userNotes={session.user_notes} />
          </TabPanel>
        </Tabs>
      )}
    </PageContainer>
  )
}
