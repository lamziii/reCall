import { getFirebaseAuth } from './auth'
import { benchmarkTranscriptionUrl } from './config'
import type { SessionSpeaker, TranscriptSegment } from '@/data/live/types'

// Client for the internal benchmarkTranscription Cloud Function. Uploads one audio file and gets
// back each provider's transcript for side-by-side comparison. Provider API keys stay server-side;
// this only sends the audio + a few option headers with the caller's Firebase ID token.

export type TranscriptionProviderName = 'openai' | 'speechmatics'

export interface BenchmarkResult {
  provider: TranscriptionProviderName
  detectedLanguage?: string
  durationSeconds?: number
  text: string
  segments: TranscriptSegment[]
  speakers: SessionSpeaker[]
  processingTimeMs: number
  estimatedCost?: number
  diarized: boolean
}

export interface BenchmarkResponse {
  results: BenchmarkResult[]
  errors: Array<{ provider: string; error: string }>
}

export interface BenchmarkOptions {
  providers?: TranscriptionProviderName[]
  language?: 'sq' | 'en' | 'auto'
  enableDiarization?: boolean
  expectedSpeakers?: number
}

export class BenchmarkError extends Error {}

/** Reads an audio file's duration (seconds) so the server can estimate per-minute cost. Best-effort. */
export function readAudioDuration(file: Blob): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      const d = audio.duration
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(d) && d > 0 ? d : undefined)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    audio.src = url
  })
}

export async function runTranscriptionBenchmark(audio: File, options: BenchmarkOptions = {}): Promise<BenchmarkResponse> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new BenchmarkError('You need to be signed in to run the benchmark.')
  const token = await user.getIdToken()

  const durationSeconds = await readAudioDuration(audio)

  const headers: Record<string, string> = {
    'Content-Type': audio.type || 'audio/webm',
    Authorization: `Bearer ${token}`,
    'X-Diarization': String(options.enableDiarization ?? true),
  }
  if (options.providers?.length) headers['X-Providers'] = options.providers.join(',')
  if (options.language && options.language !== 'auto') headers['X-Language'] = options.language
  if (options.expectedSpeakers) headers['X-Expected-Speakers'] = String(options.expectedSpeakers)
  if (durationSeconds) headers['X-Audio-Duration'] = String(Math.round(durationSeconds))

  let res: Response
  try {
    res = await fetch(benchmarkTranscriptionUrl, { method: 'POST', headers, body: audio })
  } catch {
    throw new BenchmarkError("Couldn't reach Recall's servers. Check your connection and try again.")
  }

  let body: Partial<BenchmarkResponse> & { error?: string } = {}
  try {
    body = await res.json()
  } catch {
    // fall through to status handling
  }

  if (!res.ok) throw new BenchmarkError(body.error || 'The benchmark request failed. Please try again.')
  return { results: body.results ?? [], errors: body.errors ?? [] }
}
