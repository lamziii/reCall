import { ref, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseAuth } from './auth'
import { getFirebaseStorage } from './storage'
import { extractReviewUrl, transcribeUrl, transcribeVoiceUrl } from './config'
import type { SessionReviewDoc, SessionSpeaker, TranscriptSegment } from '@/data/live/types'

export class ExtractReviewError extends Error {}

// A single Cloud Functions HTTP request body can't exceed ~32MB, so recordings above this go to
// Cloud Storage first and the function reads them out-of-band (removing any duration ceiling).
// Short meetings stay on the fast inline path. 20MB ≈ ~1h of speech-bitrate Opus.
const INLINE_UPLOAD_LIMIT_BYTES = 20 * 1024 * 1024

function audioExt(mime: string): string {
  const t = (mime || '').toLowerCase()
  if (t.includes('ogg')) return 'ogg'
  if (t.includes('mp4') || t.includes('m4a') || t.includes('aac')) return 'm4a'
  if (t.includes('mpeg') || t.includes('mp3')) return 'mp3'
  if (t.includes('wav')) return 'wav'
  return 'webm'
}

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
export async function requestTranscription(
  sessionId: string,
  audio: Blob,
  options: { workspaceId?: string; durationSeconds?: number } = {},
): Promise<TranscriptionResult> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new ExtractReviewError('You need to be signed in to transcribe a recording.')
  const token = await user.getIdToken()

  const headers: Record<string, string> = {
    'Content-Type': audio.type || 'audio/webm',
    Authorization: `Bearer ${token}`,
    'X-Session-Id': sessionId,
  }
  if (options.durationSeconds && options.durationSeconds > 0) {
    headers['X-Audio-Duration'] = String(Math.round(options.durationSeconds))
  }

  // Large recordings can't fit in one request body — upload to Storage and send only the path.
  // Path matches storage.rules (workspaces/<id>/recordings/**). Falls back to inline on any upload
  // failure so a Storage hiccup never blocks a recording that would have fit anyway.
  let requestBody: BodyInit = audio
  if (audio.size > INLINE_UPLOAD_LIMIT_BYTES && options.workspaceId) {
    const path = `workspaces/${options.workspaceId}/recordings/${sessionId}.${audioExt(audio.type)}`
    try {
      await uploadBytesResumable(ref(getFirebaseStorage(), path), audio, { contentType: audio.type || 'audio/webm' })
      headers['X-Audio-Storage-Path'] = path
      requestBody = new Blob([]) // path travels in the header; body is unused on the Storage path
    } catch {
      // fall through to inline (may still be rejected server-side if truly over the request limit)
    }
  }

  let res: Response
  try {
    res = await fetch(transcribeUrl, { method: 'POST', headers, body: requestBody })
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

/**
 * Transcribes a short voice snippet (from the Recall AI composer) via the authenticated
 * transcribeVoice function — OpenAI server-side, no session written. Returns plain text. Throws a
 * user-safe ExtractReviewError on failure so the caller can fall back or surface a message.
 */
export async function requestVoiceTranscription(audio: Blob, durationSeconds?: number): Promise<string> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new ExtractReviewError('You need to be signed in to use voice input.')
  const token = await user.getIdToken()

  const headers: Record<string, string> = {
    'Content-Type': audio.type || 'audio/webm',
    Authorization: `Bearer ${token}`,
  }
  if (durationSeconds && durationSeconds > 0) headers['X-Audio-Duration'] = String(Math.round(durationSeconds))

  let res: Response
  try {
    res = await fetch(transcribeVoiceUrl, { method: 'POST', headers, body: audio })
  } catch {
    throw new ExtractReviewError("Couldn't reach Recall's servers. Check your connection and try again.")
  }

  let body: { text?: string; error?: string } = {}
  try {
    body = await res.json()
  } catch {
    /* fall through */
  }
  if (!res.ok) throw new ExtractReviewError(body.error || "Couldn't transcribe that. Please try again.")
  return (body.text ?? '').trim()
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
