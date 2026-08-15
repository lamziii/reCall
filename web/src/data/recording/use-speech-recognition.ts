import { useEffect, useRef, useState } from 'react'
import type { FinalizedSegment } from './recording-types'

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export const isSpeechRecognitionSupported = getRecognitionCtor() !== null

export interface UseSpeechRecognitionOptions {
  /** Recognition only runs while this is true — false covers both "paused" and "not started yet". */
  active: boolean
  lang: string
}

/**
 * Wraps the browser SpeechRecognition API. Finalized segments accumulate in React state
 * across restarts (recognition sessions end on their own after ~60s of silence in some
 * browsers); interim text is ephemeral and reset on every restart.
 */
export function useSpeechRecognition({ active, lang }: UseSpeechRecognitionOptions) {
  const [segments, setSegments] = useState<FinalizedSegment[]>([])
  const [interimText, setInterimText] = useState('')
  const activeRef = useRef(active)
  const startTimeRef = useRef(Date.now())
  const segmentCounter = useRef(0)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const Ctor = getRecognitionCtor()
    if (!active || !Ctor) return

    let stoppedIntentionally = false
    let current: SpeechRecognition | null = null

    function createAndStart() {
      const recognition = new Ctor!()
      recognition.lang = lang
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0]?.transcript ?? ''
          if (result.isFinal) {
            if (text.trim()) {
              segmentCounter.current += 1
              setSegments((prev) => [
                ...prev,
                { id: `seg-${segmentCounter.current}`, text: text.trim(), offsetSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000) },
              ])
            }
          } else {
            interim += text
          }
        }
        setInterimText(interim)
      }

      recognition.onerror = () => {
        // onend always fires right after — that's where restart/stop is decided.
      }

      recognition.onend = () => {
        setInterimText('')
        if (!stoppedIntentionally && activeRef.current) {
          createAndStart()
        }
      }

      current = recognition
      recognition.start()
    }

    createAndStart()

    return () => {
      stoppedIntentionally = true
      current?.stop()
      current = null
    }
  }, [active, lang])

  function reset() {
    setSegments([])
    setInterimText('')
    segmentCounter.current = 0
    startTimeRef.current = Date.now()
  }

  return { isSupported: isSpeechRecognitionSupported, segments, interimText, reset }
}
