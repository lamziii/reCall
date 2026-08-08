import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { getDb } from '@/lib/firebase/firestore'
import { getFirebaseStorage } from '@/lib/firebase/storage'
import type { PlanTier } from '@/data/plans'
import type { CandidateTask } from './review'
import { candidateToTaskInput } from './mappers'
import type { LiveSessionDoc, LiveTaskDoc, SessionReviewDoc, SessionSpeaker, TranscriptSegment, TranscriptionStatus } from './types'

// ---- Sessions ----------------------------------------------------------------

export interface CreateSessionInput {
  workspaceId: string
  title: string
  transcript: string
  sessionType?: string
  projectName?: string | null
  participants?: string[]
  notes?: string | null
  segments?: TranscriptSegment[]
  speakers?: SessionSpeaker[]
  createdBy: string
  /** 'pending' for a recording awaiting OpenAI; 'none' for an imported/manual transcript. */
  transcriptionStatus?: TranscriptionStatus
  /** Expected meeting languages (soft transcription hints, e.g. ['sq','en']). */
  expectedLanguages?: string[]
  /** Recorded audio length, captured client-side when the mic recording stops. Powers monthly hour-limit enforcement. */
  durationSeconds?: number
}

/** Creates a session, generating its Firestore doc id first so the same id is used for the
 * whole workflow (session → audio upload → extractSessionReview → session_reviews/{id}).
 * Returns the id. */
export async function createSession(input: CreateSessionInput): Promise<string> {
  const db = getDb()
  const ref = doc(collection(db, 'sessions'))
  const payload = {
    workspace_id: input.workspaceId,
    title: input.title,
    status: 'completed' as const,
    session_type: input.sessionType ?? 'Meeting',
    transcript: input.transcript,
    project_name: input.projectName ?? null,
    participants: input.participants ?? [],
    notes: input.notes ?? null,
    segments: input.segments ?? [],
    speakers: input.speakers ?? [],
    transcription_status: input.transcriptionStatus ?? 'none',
    expected_languages: input.expectedLanguages ?? ['sq', 'en'],
    duration_seconds: input.durationSeconds ?? null,
    transcription_provider: null,
    transcription_model: null,
    transcription_error: null,
    created_by: input.createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }
  await setDoc(ref, payload)
  return ref.id
}

/** Updates just the transcription lifecycle fields (client-side optimistic lock / retry reset). */
export async function setTranscriptionStatus(
  sessionId: string,
  status: TranscriptionStatus,
  extra?: { error?: string | null },
): Promise<void> {
  await updateDoc(doc(getDb(), 'sessions', sessionId), {
    transcription_status: status,
    ...(extra?.error !== undefined ? { transcription_error: extra.error } : {}),
    updated_at: serverTimestamp(),
  })
}

/**
 * Uploads a recording to Cloud Storage at the member-scoped path the rules already permit
 * (workspaces/{ws}/recordings/{sessionId}.webm) and returns that object path. Best-effort: the
 * transcript is the AI source, so the caller should not fail the whole flow if this throws.
 */
export async function uploadSessionAudio(
  workspaceId: string,
  sessionId: string,
  blob: Blob,
  mimeType: string,
): Promise<string> {
  const path = `workspaces/${workspaceId}/recordings/${sessionId}.webm`
  await uploadBytes(storageRef(getFirebaseStorage(), path), blob, { contentType: mimeType })
  return path
}

/** Persists the recording's Storage path + audio metadata on the session. */
export async function saveSessionRecording(
  sessionId: string,
  recordingPath: string,
  audio: { mimeType: string; durationSeconds: number },
): Promise<void> {
  await updateDoc(doc(getDb(), 'sessions', sessionId), {
    recording_url: recordingPath,
    audio,
    updated_at: serverTimestamp(),
  })
}

/** Resolves a downloadable URL for a stored recording (for audio playback). */
export async function getSessionAudioUrl(recordingPath: string): Promise<string> {
  return getDownloadURL(storageRef(getFirebaseStorage(), recordingPath))
}

/** Updates the session's speaker roster/mapping (used by the manual speaker-mapping UI). */
export async function saveSpeakerMapping(sessionId: string, speakers: SessionSpeaker[]): Promise<void> {
  await updateDoc(doc(getDb(), 'sessions', sessionId), { speakers, updated_at: serverTimestamp() })
}

export interface LiveWorkspaceDoc {
  id: string
  name?: string
  owner_id?: string
  plan?: PlanTier
  /** Extra minutes purchased on top of the plan's included monthly hours (see data/plans.ts USAGE_PACKS). */
  bonus_minutes?: number
  /** Extra Recall AI questions purchased on top of the plan's monthly limit (see AI_QUESTION_PACKS). */
  bonus_ai_questions?: number
  /** Recall AI questions used per calendar month, keyed "YYYY-MM". Written server-side by recallAiChat. */
  ai_usage?: Record<string, number>
}

/** Updates the workspace's subscription plan (Settings' plan switcher). */
export async function setWorkspacePlan(workspaceId: string, plan: PlanTier): Promise<void> {
  await updateDoc(doc(getDb(), 'workspaces', workspaceId), { plan, updated_at: serverTimestamp() })
}

/** Adds minutes from a purchased usage pack (Usage page "buy more usage") on top of the current total. */
export async function addWorkspaceBonusMinutes(workspaceId: string, minutes: number): Promise<void> {
  await updateDoc(doc(getDb(), 'workspaces', workspaceId), {
    bonus_minutes: increment(minutes),
    updated_at: serverTimestamp(),
  })
}

/** Adds Recall AI questions from a purchased pack (Usage page "buy more questions") to the monthly limit. */
export async function addWorkspaceBonusAiQuestions(workspaceId: string, questions: number): Promise<void> {
  await updateDoc(doc(getDb(), 'workspaces', workspaceId), {
    bonus_ai_questions: increment(questions),
    updated_at: serverTimestamp(),
  })
}

/** Subscribes to the workspace doc — used to show the real workspace name in the shell. */
export function subscribeWorkspace(
  workspaceId: string,
  onData: (workspace: LiveWorkspaceDoc | null) => void,
  onError: (err: unknown) => void,
): () => void {
  return onSnapshot(
    doc(getDb(), 'workspaces', workspaceId),
    (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as LiveWorkspaceDoc) : null),
    onError,
  )
}

export function subscribeSession(
  sessionId: string,
  onData: (session: LiveSessionDoc | null) => void,
  onError: (err: unknown) => void,
): () => void {
  return onSnapshot(
    doc(getDb(), 'sessions', sessionId),
    (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as LiveSessionDoc) : null),
    onError,
  )
}

export function subscribeSessions(
  workspaceId: string,
  onData: (sessions: LiveSessionDoc[]) => void,
  onError: (err: unknown) => void,
): () => void {
  const q = query(
    collection(getDb(), 'sessions'),
    where('workspace_id', '==', workspaceId),
    orderBy('created_at', 'desc'),
  )
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LiveSessionDoc)),
    onError,
  )
}

// ---- Reviews -----------------------------------------------------------------

export function subscribeReview(
  sessionId: string,
  onData: (review: SessionReviewDoc | null) => void,
  onError: (err: unknown) => void,
): () => void {
  return onSnapshot(
    doc(getDb(), 'session_reviews', sessionId),
    (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as SessionReviewDoc) : null),
    onError,
  )
}

// ---- Tasks -------------------------------------------------------------------

export function subscribeTasks(
  workspaceId: string,
  onData: (tasks: LiveTaskDoc[]) => void,
  onError: (err: unknown) => void,
): () => void {
  const q = query(collection(getDb(), 'tasks'), where('workspace_id', '==', workspaceId))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LiveTaskDoc)),
    onError,
  )
}

export function subscribeTasksForSession(
  sessionId: string,
  onData: (tasks: LiveTaskDoc[]) => void,
  onError: (err: unknown) => void,
): () => void {
  const q = query(collection(getDb(), 'tasks'), where('session_id', '==', sessionId))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LiveTaskDoc)),
    onError,
  )
}

export async function updateTaskStatus(taskId: string, status: LiveTaskDoc['status']): Promise<void> {
  await updateDoc(doc(getDb(), 'tasks', taskId), { status, updated_at: serverTimestamp() })
}

/** Creates a user-authored (origin 'manual') task in the same canonical `tasks` collection as the
 *  AI-extracted ones, so both appear together everywhere. Returns the new task id. */
export async function createManualTask(input: {
  workspaceId: string
  title: string
  deadline?: string | null
  priority?: LiveTaskDoc['priority']
  createdBy: string
}): Promise<string> {
  const db = getDb()
  const ref = doc(collection(db, 'tasks'))
  await setDoc(ref, {
    workspace_id: input.workspaceId,
    project_id: null,
    session_id: null,
    title: input.title.trim(),
    owner: 'Unassigned',
    deadline: input.deadline?.trim() || null,
    priority: input.priority ?? 'amber',
    status: 'todo',
    origin: 'manual',
    source_review_id: null,
    source_candidate_index: null,
    source_session_title: null,
    created_by: input.createdBy,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })
  return ref.id
}

/**
 * Promotes a review candidate into a real board task (Contract 2). Idempotent: the task id is
 * derived from the session + candidate index, so a double-click (or a repeat promotion) writes
 * the same document instead of creating a duplicate. Returns the task id.
 */
export async function promoteCandidateTask(params: {
  workspaceId: string
  sessionId: string
  reviewId: string
  candidateIndex: number
  candidate: CandidateTask
  projectId?: string | null
}): Promise<string> {
  const db = getDb()
  const taskId = `${params.sessionId}-t${params.candidateIndex}`
  const ref = doc(db, 'tasks', taskId)

  const existing = await getDoc(ref)
  if (existing.exists()) return taskId // already promoted — dedupe

  const fields = candidateToTaskInput(params.candidate) // enforces Contract 2 field rules
  const task: Omit<LiveTaskDoc, 'id'> = {
    workspace_id: params.workspaceId,
    project_id: params.projectId ?? null,
    session_id: params.sessionId,
    ...fields,
    source_review_id: params.reviewId,
    source_candidate_index: params.candidateIndex,
    created_at: serverTimestamp() as unknown as null,
    updated_at: serverTimestamp() as unknown as null,
  }
  await setDoc(ref, task)
  return taskId
}

/** One-shot check of which candidate indices for a session already have board tasks. */
export async function getPromotedIndices(sessionId: string): Promise<Set<number>> {
  const q = query(collection(getDb(), 'tasks'), where('session_id', '==', sessionId))
  const snap = await getDocs(q)
  const set = new Set<number>()
  snap.forEach((d) => {
    const idx = (d.data() as LiveTaskDoc).source_candidate_index
    if (typeof idx === 'number') set.add(idx)
  })
  return set
}
