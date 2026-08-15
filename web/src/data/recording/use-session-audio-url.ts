import { useEffect, useState } from 'react'
import { getRecordingAudio } from './audio-storage-service'

/** Lazily loads a recorded session's audio Blob from IndexedDB and exposes it as an object URL, revoked on cleanup. */
export function useSessionAudioUrl(sessionId: string, enabled: boolean): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let objectUrl: string | null = null

    getRecordingAudio(sessionId).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sessionId, enabled])

  return url
}
