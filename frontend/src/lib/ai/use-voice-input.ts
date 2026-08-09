import { useCallback, useRef, useState } from 'react'
import { useAudioRecorder } from '@/data/recording/use-audio-recorder'
import { requestVoiceTranscription, ExtractReviewError } from '@/lib/firebase/functions'

/**
 * Where voice → text happens.
 *   'openai'  — record audio, transcribe server-side with our OpenAI model (best quality).
 *   'browser' — the browser's built-in Web Speech API (free, no server cost, lower accuracy).
 *
 * OpenAI is the default. If it proves too costly or the quality isn't worth it, flip this one
 * constant to 'browser' (or wire it to an env var) — the composer UI stays the same.
 */
export const VOICE_INPUT_MODE: 'openai' | 'browser' =
  (import.meta.env.VITE_RECALL_VOICE_MODE as 'openai' | 'browser') || 'openai'

export type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'error'

export interface UseVoiceInput {
  state: VoiceInputState
  error: string | null
  /** True when the runtime can record audio at all. */
  supported: boolean
  /** Begin recording. */
  start: () => Promise<void>
  /** Stop and transcribe; the result is delivered via the `onResult` passed to the hook. */
  stop: () => Promise<void>
}

const MIN_RECORDING_SECONDS = 0.4 // ignore accidental taps

/**
 * Push-to-talk voice input for the Recall AI composer (OpenAI mode). Records with the shared audio
 * recorder, then transcribes server-side and hands the text back through `onResult`. Errors are
 * surfaced (never thrown at the UI) so the mic button can show a transient error and recover.
 */
export function useVoiceInput(onResult: (text: string) => void): UseVoiceInput {
  const recorder = useAudioRecorder()
  const [state, setState] = useState<VoiceInputState>('idle')
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined'

  const start = useCallback(async () => {
    if (busyRef.current || !supported) return
    setError(null)
    const ok = await recorder.start()
    if (ok) {
      setState('recording')
    } else {
      setError(recorder.errorMessage ?? 'Recall needs microphone access to use voice input.')
      setState('error')
    }
  }, [recorder, supported])

  const stop = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      const result = await recorder.stop()
      if (!result || result.durationSeconds < MIN_RECORDING_SECONDS || result.blob.size === 0) {
        setState('idle')
        return
      }
      setState('transcribing')
      const text = await requestVoiceTranscription(result.blob, result.durationSeconds)
      if (text) onResult(text)
      setState('idle')
    } catch (err) {
      setError(err instanceof ExtractReviewError ? err.message : "Couldn't transcribe that. Please try again.")
      setState('error')
    } finally {
      busyRef.current = false
    }
  }, [recorder, onResult])

  return { state, error, supported, start, stop }
}
