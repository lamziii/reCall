/**
 * Canonical Active Session model — the single source of truth for an in-progress recording, owned by
 * ActiveSessionProvider (mounted in the /app layout so it survives route changes). No page or popup
 * owns this state.
 */

/** Explicit lifecycle. Guarded transitions live in the provider (see canTransition). */
export type ActiveSessionStatus =
  | 'idle' // nothing recording
  | 'preparing' // Start pressed: requesting mic + creating the session doc
  | 'recording' // mic live, MediaRecorder running
  | 'stopping' // End pressed: finalizing the MediaRecorder
  | 'uploading' // persisting the audio blob (IndexedDB today)
  | 'processing' // handing off to the review/transcription pipeline
  | 'completed' // handoff done
  | 'failed' // mic denied / save failed / etc.

/** Allowed forward transitions. `failed` is reachable from any active state; `idle` resets. */
const TRANSITIONS: Record<ActiveSessionStatus, ActiveSessionStatus[]> = {
  idle: ['preparing'],
  preparing: ['recording', 'failed', 'idle'],
  recording: ['stopping', 'failed'],
  stopping: ['uploading', 'failed'],
  uploading: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: ['idle'],
  failed: ['idle'],
}

export function canTransition(from: ActiveSessionStatus, to: ActiveSessionStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

/** True while the mic is (or is about to be) live — used to guard nav/unload and double-starts. */
export function isSessionActive(status: ActiveSessionStatus): boolean {
  return status === 'preparing' || status === 'recording' || status === 'stopping' || status === 'uploading'
}

/** Metadata captured on the session-setup screen before Start. */
export interface ActiveSessionSetup {
  title: string
  sessionType: string
  projectName: string | null
  participants: string[]
  preNotes: string | null
  expectedLanguages: string[]
}

/**
 * A user's notes for a session. Stored as a `user_notes.{authorId}` map on the session doc (reuses
 * the existing sessions write rule — no schema/rules change; scoped to workspace+session+author and
 * extensible to multi-user later, when it can graduate to a subcollection). `content` is the whole
 * notebook (source of truth for display/search); `marks` records the elapsed second at each newline
 * so notes can be linked to transcript moments in a later task.
 */
export interface SessionUserNote {
  session_id: string
  workspace_id: string
  author_id: string
  content: string
  marks: NoteMark[]
  updated_at_seconds: number // elapsed seconds at last edit (client clock; server stamps updated_at)
}

/**
 * A timestamp anchor for a session. Two kinds share one array (reuse, not a competing model):
 *  - 'line'   — auto: `content.slice(0, offset)` was written by ~`timestamp_seconds` (notebook newlines).
 *  - 'moment' — explicit "Mark moment": the user flagged this second as important. `created_at_ms` set.
 * Later the AI uses 'moment' marks as high-signal context (not implemented yet).
 */
export interface NoteMark {
  /** DEPRECATED as an anchor: a char offset into the plain text. Unreliable in the block model, so
   *  new marks treat timestamp_seconds/created_at_ms as authoritative and set offset best-effort
   *  (or omit it). Kept optional for backward compatibility with existing marks. */
  offset?: number
  timestamp_seconds: number
  kind?: 'line' | 'moment'
  created_at_ms?: number
}

/** Low-frequency snapshot exposed via context. High-frequency amplitude is NOT here (see waveform). */
export interface ActiveSessionState {
  status: ActiveSessionStatus
  sessionId: string | null
  workspaceId: string | null
  title: string
  startedAtMs: number | null
  elapsedSeconds: number
  micLabel: string | null
  errorMessage: string | null
  noteSaveState: 'idle' | 'saving' | 'saved'
}

export type NoteSaveState = ActiveSessionState['noteSaveState']
