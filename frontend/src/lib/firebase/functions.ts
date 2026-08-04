import { getFirebaseAuth } from './auth'
import { extractReviewUrl, transcribeUrl } from './config'
import type { SessionReviewDoc, SessionSpeaker, TranscriptSegment } from '@/data/live/types'

export class ExtractReviewError extends Error {}

export interface TranscriptionResult {
  transcript: string
  segments: TranscriptSegment[]
  speakers: SessionSpeaker[]
  detectedLanguage: string | null
  provider: string | null
  model: string | null
}

/**
 * Sends the recorded audio to the authenticated transcribeSession Cloud Function, which runs
 * OpenAI gpt-4o-transcribe (multilingual, no diarization) server-side and writes the transcript
 * onto the session (segments/speakers come back empty). The audio bytes are the raw body;
 * sessionId travels in a header. Throws a user-safe ExtractReviewError on failure so the caller
 * can fall back to the browser transcript. The OpenAI key stays server-side — never in the client.
 */
export async function requestTranscription(sessionId: string, audio: Blob): Promise<TranscriptionResult> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new ExtractReviewError('You need to be signed in to transcribe a recording.')
  const token = await user.getIdToken()

  let res: Response
  try {
    res = await fetch(transcribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': audio.type || 'audio/webm',
        Authorization: `Bearer ${token}`,
        'X-Session-Id': sessionId,
      },
      body: audio,
    })
  } catch {
    throw new ExtractReviewError("Couldn't reach Recall's servers. Check your connection and try again.")
  }

  let body: {
    transcript?: string
    segments?: TranscriptSegment[]
    speakers?: SessionSpeaker[]
    detected_language?: string | null
    provider?: string | null
    model?: string | null
    error?: string
  } = {}
  try {
    body = await res.json()
  } catch {
    // fall through to status-based handling
  }

  if (!res.ok || !body.transcript) {
    throw new ExtractReviewError(body.error || "Couldn't transcribe the audio. Please try again.")
  }
  return {
    transcript: body.transcript,
    segments: body.segments ?? [],
    speakers: body.speakers ?? [],
    detectedLanguage: body.detected_language ?? null,
    provider: body.provider ?? null,
    model: body.model ?? null,
  }
}

export interface RequestSessionReviewOptions {
  segments?: TranscriptSegment[]
  speakers?: SessionSpeaker[]
}

/**
 * Calls the authenticated extractSessionReview Cloud Function (Contract 3). Attaches the
 * current user's Firebase ID token, parses the { session_review } | { error } envelope, and
 * throws a user-safe ExtractReviewError on any non-2xx / malformed response. Optional
 * segments/speakers let the server build a speaker-labeled transcript (recording path).
 */
export async function requestSessionReview(
  sessionId: string,
  transcript: string,
  options: RequestSessionReviewOptions = {},
): Promise<SessionReviewDoc> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new ExtractReviewError('You need to be signed in to generate a review.')

  const token = await user.getIdToken()

  const payload: Record<string, unknown> = { session_id: sessionId, transcript }
  if (options.segments?.length) payload.segments = options.segments
  if (options.speakers?.length) payload.speakers = options.speakers

  let res: Response
  try {
    res = await fetch(extractReviewUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ExtractReviewError("Couldn't reach Recall's servers. Check your connection and try again.")
  }

  let body: { session_review?: SessionReviewDoc; error?: string } = {}
  try {
    body = await res.json()
  } catch {
    // fall through to status-based handling
  }

  if (!res.ok || !body.session_review) {
    throw new ExtractReviewError(
      body.error || 'Recall could not organize this session. Your transcript is saved — please try again.',
    )
  }
  return body.session_review
}
