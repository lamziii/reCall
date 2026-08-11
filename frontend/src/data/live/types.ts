import type { Timestamp } from 'firebase/firestore'
import type { SessionReview } from './review'

/**
 * Firestore document shapes for live mode. These mirror firebase/FIREBASE_SCHEMA.md.
 * Timestamp fields are `Timestamp | null` because serverTimestamp() reads back as null in the
 * brief window before the server resolves it (and in optimistic local snapshots).
 */

export type SessionReviewStatus = 'processing' | 'completed' | 'failed'

/**
 * OpenAI transcription lifecycle for a session (added field). Drives the record→review handoff so
 * the browser SpeechRecognition transcript is only ever TEMPORARY and Claude runs only once the
 * final OpenAI transcript exists.
 *   none       — imported/manual transcript (no audio); it is the source, Claude may run.
 *   pending    — recorded, audio saved locally, OpenAI not started yet.
 *   processing — OpenAI request in flight.
 *   complete   — OpenAI transcript saved; it replaced the browser transcript.
 *   failed     — OpenAI failed; browser transcript stays TEMPORARY, Claude must NOT auto-run.
 */
export type TranscriptionStatus = 'none' | 'pending' | 'processing' | 'complete' | 'failed'

/** A transcript segment. From the browser Web Speech path speakerLabel is a generic "Speaker N". */
export interface TranscriptSegment {
  id: string
  speakerId: string
  speakerLabel: string
  startMs: number
  endMs: number
  text: string
  confidence?: number
}

/** A speaker in a session. `displayName` is null until the user maps the label to a real name. */
export interface SessionSpeaker {
  id: string
  label: string
  displayName: string | null
  participantId?: string | null
}

export interface LiveSessionDoc {
  id: string
  workspace_id: string
  title: string
  status?: 'scheduled' | 'live' | 'completed'
  /** Start time for a scheduled meeting (status 'scheduled'), set by scheduleSession(). Distinct
   *  from created_at (when the doc was written) — the calendar/reminders place the session by this. */
  scheduled_at?: Timestamp | null
  /** Optional video/call link for a scheduled meeting. */
  meeting_link?: string | null
  /** Minutes before scheduled_at to fire an in-app reminder. Defaults to 10 when unset. */
  reminder_minutes_before?: number | null
  /** Session type (Meeting, Investor Conversation, …). Added field. */
  session_type?: string
  /**
   * Review-generation state (added field — see FIREBASE_SCHEMA.md). Distinct from `status`
   * (the session lifecycle). Drives the processing / failed UI on the Session Review page.
   */
  review_status?: SessionReviewStatus
  transcript?: string
  project_id?: string | null
  /** Denormalized project name for display (avoids a projects lookup in the demo). */
  project_name?: string | null
  /** Participant display names entered at creation. */
  participants?: string[]
  /** Free-text notes entered before recording. Added field. */
  notes?: string | null
  created_by?: string
  /** Storage object path of the uploaded recording, e.g. workspaces/{ws}/recordings/{id}.webm */
  recording_url?: string | null
  audio?: { mimeType: string; durationSeconds: number } | null
  /** Recorded length in seconds, written directly at session creation (record-live.tsx). Primary source for duration; `audio.durationSeconds` (Storage upload path) is legacy/unused. */
  duration_seconds?: number | null
  /** Raw transcript segments (temporary browser turns until OpenAI overwrites them). */
  segments?: TranscriptSegment[]
  /** Speaker roster + label→name mapping for this session. */
  speakers?: SessionSpeaker[]
  /** OpenAI transcription lifecycle — see TranscriptionStatus. Undefined on legacy sessions. */
  transcription_status?: TranscriptionStatus
  /** Provider that produced the final transcript (e.g. "openai"). Set on complete. */
  transcription_provider?: string | null
  /** Concrete model that ran (e.g. gpt-4o-transcribe-diarize, or the fallback). Set on complete. */
  transcription_model?: string | null
  /** User-safe error when transcription_status === 'failed'. */
  transcription_error?: string | null
  /** Live chunk progress for long recordings (transcribed in chunks). Persisted so the % survives a
   *  refresh; cleared (null) on completion. Absent for short single-chunk recordings. */
  transcription_progress?: { completed: number; total: number } | null
  /** BCP-47-ish language OpenAI detected/used, if any. */
  detected_language?: string | null
  /** Denormalized from the review on analysis-complete (see extractSessionReview) — powers the
   *  Sessions list / Home / Calendar without a per-row review read. */
  review_summary?: string | null
  tasks_count?: number
  decisions_count?: number
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}

/** session_reviews/{sessionId} — the AI output (Contract 1). Doc ID === session ID. */
export interface SessionReviewDoc extends SessionReview {
  id: string
  session_id: string
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}

/** tasks/{taskId} — the persisted, actionable board task (Contract 2). */
export interface LiveTaskDoc {
  id: string
  workspace_id: string
  project_id: string | null
  session_id: string | null
  title: string
  owner: string
  deadline: string | null
  priority: 'red' | 'amber' | 'gray'
  status: 'todo' | 'in_progress' | 'done'
  /** Source linkage back to the review candidate this task was promoted from (added fields). */
  source_review_id?: string | null
  source_candidate_index?: number | null
  /** 'session' for AI-extracted tasks, 'manual' for user-created ones. Undefined on legacy docs. */
  origin?: 'session' | 'manual'
  /** Denormalized source session title, so Tasks/Home can show "From …" without a sessions join. */
  source_session_title?: string | null
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}
