import { useEffect, useState } from 'react'
import { getSessionAudioUrl } from './live-store'
import { getLocalAudioBlob } from './local-audio'

/**
 * Resolves a playable audio URL for the review page. Prefers a locally-stored recording
 * (IndexedDB, keyed by sessionId — the demo path with no Cloud Storage), and falls back to a
 * Cloud Storage download URL if a recording path is present (for sessions uploaded that way).
 */
export function useLiveAudioUrl(
  sessionId: string | undefined,
  recordingPath: string | null | undefined,
): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function load() {
      if (sessionId) {
        const blob = await getLocalAudioBlob(sessionId).catch(() => null)
        if (blob) {
          objectUrl = URL.createObjectURL(blob)
          if (!cancelled) setUrl(objectUrl)
          return
        }
      }
      if (recordingPath) {
        try {
          const u = await getSessionAudioUrl(recordingPath)
          if (!cancelled) setUrl(u)
        } catch {
          if (!cancelled) setUrl(null)
        }
        return
      }
      if (!cancelled) setUrl(null)
    }
    void load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sessionId, recordingPath])

  return url
}
