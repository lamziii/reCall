import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioRecorderResult, RecordingStatus } from './recording-types'

const CANDIDATE_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

function messageForError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No microphone was detected. Connect a microphone and try again.'
  }
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Recall needs microphone access to record this session. Allow microphone access in your browser settings and try again.'
  }
  return 'Recording was interrupted. Please try again.'
}

/** Wraps getUserMedia + MediaRecorder + an AnalyserNode for live mic levels. One recorder per mount. */
export function useAudioRecorder() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef('audio/webm')
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const baseElapsedRef = useRef(0)
  const elapsedRef = useRef(0)

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const releaseMedia = useCallback(() => {
    stopTimer()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    audioContextRef.current?.close().catch(() => {})
    audioContextRef.current = null
    setAnalyserNode(null)
    recorderRef.current = null
  }, [stopTimer])

  // Belt-and-suspenders: stop the mic if the page unmounts mid-recording (nav guard covers the intentional-leave path).
  useEffect(() => releaseMedia, [releaseMedia])

  const start = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null)
    setStatus('requesting-permission')

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('error')
      setErrorMessage('Audio recording is not supported in this browser. Try the latest version of Chrome, Edge, or Safari.')
      return false
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      setStatus('error')
      setErrorMessage(messageForError(err))
      return false
    }

    const mimeType = pickMimeType()
    if (!mimeType) {
      stream.getTracks().forEach((track) => track.stop())
      setStatus('error')
      setErrorMessage('Audio recording is not supported in this browser. Try the latest version of Chrome, Edge, or Safari.')
      return false
    }

    streamRef.current = stream
    mimeTypeRef.current = mimeType
    setDeviceLabel(stream.getAudioTracks()[0]?.label || 'Default microphone')

    // Cap the bitrate: speech is fine at 32kbps Opus, and a predictable low bitrate keeps file size
    // linear with duration (~0.24MB/min) — most meetings stay on the fast inline upload path, chunks
    // land well under OpenAI's 25MB/request cap, and Storage/transcription cost stays down.
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 })
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorderRef.current = recorder

    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      const audioContext = new AudioCtx()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioContextRef.current = audioContext
      setAnalyserNode(analyser)
    }

    recorder.start(250)
    startedAtRef.current = Date.now()
    baseElapsedRef.current = 0
    elapsedRef.current = 0
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      const secs = baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
      elapsedRef.current = secs
      setElapsedSeconds(secs)
    }, 250)

    setStatus('recording')
    return true
  }, [])

  const pause = useCallback(() => {
    if (recorderRef.current?.state !== 'recording') return
    recorderRef.current.pause()
    stopTimer()
    baseElapsedRef.current = elapsedRef.current
    setStatus('paused')
  }, [stopTimer])

  const resume = useCallback(() => {
    if (recorderRef.current?.state !== 'paused') return
    recorderRef.current.resume()
    startedAtRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const secs = baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
      elapsedRef.current = secs
      setElapsedSeconds(secs)
    }, 250)
    setStatus('recording')
  }, [])

  const stop = useCallback((): Promise<AudioRecorderResult | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        releaseMedia()
        setStatus('stopped')
        resolve(null)
        return
      }
      setStatus('stopping')
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
        const durationSeconds = elapsedRef.current
        releaseMedia()
        setStatus('stopped')
        resolve({ blob, mimeType: mimeTypeRef.current, durationSeconds })
      }
      recorder.stop()
    })
  }, [releaseMedia])

  return { status, elapsedSeconds, errorMessage, deviceLabel, analyserNode, start, pause, resume, stop }
}
