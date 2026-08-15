import { useCallback, useEffect, useRef, useState } from 'react'
import { getLocalAudioBlob } from '@/data/live/local-audio'
import { setTranscriptionStatus } from '@/data/live/live-store'
import { requestTranscription, ExtractReviewError } from '@/lib/firebase/functions'
import { pipelineLog } from '@/lib/diagnostics'
import type { LiveSessionDoc } from '@/data/live/types'

// Drives the OpenAI transcription step for a RECORDED session, on the review page. The record page
// only saves the audio (IndexedDB) + marks the session 'pending' and navigates; this hook does the
// upload → OpenAI → Firestore step so the browser transcript is replaced with status feedback and
// the flow survives a refresh. Claude is gated elsewhere on transcription_status === 'complete'.
//
// Duplicate prevention: we only auto-start when status is exactly 'pending', and we flip the doc to
// 'processing' BEFORE calling the function — so a refresh mid-flight reads 'processing' and does not
// re-fire. The backend writes 'complete'/'failed'; the onSnapshot in useLiveSessionReview updates UI.

// Cosmetic progress labels shown while the single request is in flight (spec-mandated wording).
export const TRANSCRIPTION_STAGES = [
  'Uploading recording…',
  'Preparing transcription…',
  'Transcribing…',
  'Identifying speakers…',
  'Finalizing…',
] as const

export interface LiveTranscriptionState {
  /** Index into TRANSCRIPTION_STAGES while processing; null when not animating. */
  stageLabel: string | null
  /** Truthful transcription percentage from persisted chunk progress (completed/total), or null for
   *  short single-chunk recordings where there's nothing meaningful to show. Survives refresh. */
  progressPercent: number | null
  /** True while this hook is actively running a request (not just reading a stale 'processing'). */
  active: boolean
  retry: () => void
}

export function useLiveTranscription(
  sessionId: string | undefined,
  session: LiveSessionDoc | null,
): LiveTranscriptionState {
  const [stageIndex, setStageIndex] = useState<number | null>(null)
  const activeRef = useRef(false)
  const [active, setActive] = useState(false)
  // Guards a single auto-start per mount so React StrictMode / re-renders can't double-fire.
  const startedRef = useRef(false)
  // Always-latest session so `run` (keyed only on sessionId) reads current workspace/duration.
  const sessionRef = useRef(session)
  sessionRef.current = session

  const run = useCallback(async () => {
    if (!sessionId || activeRef.current) return
    activeRef.current = true
    setActive(true)
    setStageIndex(0)
    pipelineLog('transcription.trigger', { sessionId })

    // Animate the cosmetic stages up to "Finalizing…" while the real request runs.
    let idx = 0
    const timer = setInterval(() => {
      idx = Math.min(idx + 1, TRANSCRIPTION_STAGES.length - 1)
      setStageIndex(idx)
    }, 1600)

    const finish = () => {
      clearInterval(timer)
      activeRef.current = false
      setActive(false)
      setStageIndex(null)
    }

    try {
      const blob = await getLocalAudioBlob(sessionId)
      if (!blob) {
        // Audio only lives in this browser's IndexedDB — can't transcribe from another device.
        await setTranscriptionStatus(sessionId, 'failed', {
          error: 'The recording audio is not available on this device to transcribe.',
        })
        finish()
        return
      }
      // Optimistic lock: mark processing before the call so a refresh won't re-trigger.
      await setTranscriptionStatus(sessionId, 'processing', { error: null })
      pipelineLog('transcription.request', { sessionId, bytes: blob.size, mime: blob.type })

      const latest = sessionRef.current
      const result = await requestTranscription(sessionId, blob, {
        workspaceId: latest?.workspace_id,
        durationSeconds: latest?.duration_seconds ?? latest?.audio?.durationSeconds ?? undefined,
      })
      // Backend already wrote transcript + status 'complete'; log for diagnostics.
      pipelineLog('transcription.response', {
        sessionId,
        provider: result.provider,
        model: result.model,
        segments: result.segments.length,
        speakers: result.speakers.length,
      })
    } catch (err) {
      const message = err instanceof ExtractReviewError ? err.message : 'OpenAI transcription failed.'
      pipelineLog('transcription.status', { sessionId, status: 'failed', message })
      await setTranscriptionStatus(sessionId, 'failed', { error: message }).catch(() => {})
    } finally {
      finish()
    }
  }, [sessionId])

  // Auto-start exactly once when the session is 'pending'.
  useEffect(() => {
    if (startedRef.current) return
    if (session?.transcription_status !== 'pending') return
    startedRef.current = true
    void run()
  }, [session?.transcription_status, run])

  // Manual retry (from the failed panel, or a stale 'processing' that no tab is driving).
  const retry = useCallback(() => {
    if (activeRef.current) return
    startedRef.current = true
    void run()
  }, [run])

  // Truthful progress from persisted chunk counts, mapped into the transcription band (10–65%) so a
  // long meeting shows real movement. Null when there are no chunk counts (short recording).
  const chunks = session?.transcription_progress
  const progressPercent =
    chunks && chunks.total > 0 ? Math.round(10 + Math.min(1, chunks.completed / chunks.total) * 55) : null

  return { stageLabel: stageIndex === null ? null : TRANSCRIPTION_STAGES[stageIndex], progressPercent, active, retry }
}
