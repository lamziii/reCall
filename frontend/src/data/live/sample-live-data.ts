import { collection, doc, getDocs, query, Timestamp, where, writeBatch } from 'firebase/firestore'
import { getDb } from '@/lib/firebase/firestore'

/**
 * Dev-only helper (invoked from Settings → Developer) that seeds the CURRENT live workspace with a
 * handful of realistic sessions + tasks in Firestore, so the Home dashboard, Sessions list,
 * Calendar and Tasks board render populated instead of their empty "record your first session"
 * state.
 *
 * Everything it writes carries `sample: true` and a deterministic id, so re-running replaces the
 * previous sample set (idempotent) and NEVER touches the user's real sessions/tasks. `clear` removes
 * only the sample-flagged docs. This is the live-Firestore counterpart to the localStorage
 * `generateSampleWorkspace()` used in demo mode.
 */

const DAY = 24 * 60 * 60 * 1000

/** ISO date string (YYYY-MM-DD) offset from today, for task deadlines. */
function isoDate(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10)
}

interface SampleSessionSpec {
  key: string
  daysAgo: number
  title: string
  sessionType: string
  projectName: string | null
  participants: string[]
  summary: string
  durationMinutes: number
  decisions: number
}

interface SampleTaskSpec {
  key: string
  sessionKey: string
  title: string
  owner: string
  deadlineOffset: number | null
  priority: 'red' | 'amber' | 'gray'
  status: 'todo' | 'in_progress' | 'done'
}

const SESSION_SPECS: SampleSessionSpec[] = [
  { key: 's1', daysAgo: 0, title: 'Q3 Planning Sync', sessionType: 'Meeting', projectName: 'Mobile v2', participants: ['Uvejs', 'Lorik', 'Amina'], summary: 'The team aligned on the Q3 roadmap, agreed to prioritise the mobile rebuild, and set a mid-quarter checkpoint. Two decisions were made and several follow-ups assigned.', durationMinutes: 42, decisions: 2 },
  { key: 's2', daysAgo: 1, title: 'Investor Conversation — Seed Round', sessionType: 'Investor Conversation', projectName: null, participants: ['Uvejs', 'Investor'], summary: 'A positioning and pricing discussion for the seed round. Agreed to keep a real free tier and to send an updated deck and data-room access this week.', durationMinutes: 35, decisions: 2 },
  { key: 's3', daysAgo: 3, title: 'Design Review — Onboarding Flow', sessionType: 'Meeting', projectName: 'Onboarding', participants: ['Lorik', 'Amina'], summary: 'Reviewed the new onboarding funnel. Approved the six-step structure and flagged copy and empty-state work before ship.', durationMinutes: 28, decisions: 1 },
  { key: 's4', daysAgo: 6, title: 'Customer Call — Acme Corp', sessionType: 'Client Call', projectName: null, participants: ['Uvejs', 'Acme PM'], summary: 'Acme walked through their rollout needs. Next step is a tailored proposal covering SSO and workspace roles.', durationMinutes: 22, decisions: 1 },
  { key: 's5', daysAgo: 9, title: 'Team Weekly Sync', sessionType: 'Meeting', projectName: null, participants: ['Uvejs', 'Lorik'], summary: 'Weekly status: recording pipeline is live end-to-end; next focus is migrating the remaining pages to Firestore.', durationMinutes: 18, decisions: 0 },
]

const TASK_SPECS: SampleTaskSpec[] = [
  { key: 't1', sessionKey: 's1', title: 'Send the revised Q3 roadmap to the team', owner: 'Uvejs', deadlineOffset: 2, priority: 'red', status: 'todo' },
  { key: 't2', sessionKey: 's1', title: 'Book the mid-quarter design review', owner: 'Lorik', deadlineOffset: -1, priority: 'amber', status: 'todo' },
  { key: 't3', sessionKey: 's1', title: 'Update the pricing deck', owner: 'Unassigned', deadlineOffset: null, priority: 'gray', status: 'in_progress' },
  { key: 't4', sessionKey: 's2', title: 'Send the investor follow-up email + deck', owner: 'Uvejs', deadlineOffset: 1, priority: 'red', status: 'todo' },
  { key: 't5', sessionKey: 's2', title: 'Prepare the data room', owner: 'Lorik', deadlineOffset: 5, priority: 'amber', status: 'todo' },
  { key: 't6', sessionKey: 's3', title: 'Finalize the onboarding copy', owner: 'Amina', deadlineOffset: 3, priority: 'amber', status: 'todo' },
  { key: 't7', sessionKey: 's3', title: 'Ship the empty-state illustrations', owner: 'Lorik', deadlineOffset: null, priority: 'gray', status: 'done' },
  { key: 't8', sessionKey: 's4', title: 'Draft the Acme proposal', owner: 'Uvejs', deadlineOffset: 4, priority: 'amber', status: 'todo' },
  { key: 't9', sessionKey: 's5', title: 'Post the weekly notes', owner: 'Unassigned', deadlineOffset: null, priority: 'gray', status: 'done' },
]

export interface SampleDocs {
  sessions: { id: string; data: Record<string, unknown> }[]
  tasks: { id: string; data: Record<string, unknown> }[]
}

/**
 * Pure builder for the sample session/task documents (Timestamps computed from `now`). Exposed for
 * unit testing; `seedLiveSampleData` writes these to Firestore.
 */
export function buildSampleDocs(workspaceId: string, createdBy: string, now: number = Date.now()): SampleDocs {
  const sessionId = (key: string) => `${workspaceId}-sample-${key}`

  const sessions = SESSION_SPECS.map((spec) => {
    const created = Timestamp.fromMillis(now - spec.daysAgo * DAY - 3 * 60 * 60 * 1000)
    const taskCount = TASK_SPECS.filter((t) => t.sessionKey === spec.key).length
    return {
      id: sessionId(spec.key),
      data: {
        workspace_id: workspaceId,
        title: spec.title,
        status: 'completed',
        session_type: spec.sessionType,
        project_name: spec.projectName,
        participants: spec.participants,
        notes: null,
        review_status: 'completed',
        review_summary: spec.summary,
        tasks_count: taskCount,
        decisions_count: spec.decisions,
        transcription_status: 'complete',
        audio: { mimeType: 'audio/webm', durationSeconds: spec.durationMinutes * 60 },
        created_by: createdBy,
        sample: true,
        created_at: created,
        updated_at: created,
      },
    }
  })

  const tasks = TASK_SPECS.map((spec) => {
    const session = SESSION_SPECS.find((s) => s.key === spec.sessionKey)!
    const created = Timestamp.fromMillis(now - session.daysAgo * DAY - 2 * 60 * 60 * 1000)
    return {
      id: `${workspaceId}-sample-${spec.key}`,
      data: {
        workspace_id: workspaceId,
        project_id: null,
        session_id: sessionId(spec.sessionKey),
        title: spec.title,
        owner: spec.owner,
        deadline: spec.deadlineOffset === null ? null : isoDate(spec.deadlineOffset),
        priority: spec.priority,
        status: spec.status,
        origin: 'session',
        source_session_title: session.title,
        sample: true,
        created_at: created,
        updated_at: created,
      },
    }
  })

  return { sessions, tasks }
}

/** Deletes only the sample-flagged sessions + tasks in this workspace. */
export async function clearLiveSampleData(workspaceId: string): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)
  for (const coll of ['sessions', 'tasks'] as const) {
    const snap = await getDocs(query(collection(db, coll), where('workspace_id', '==', workspaceId), where('sample', '==', true)))
    snap.forEach((d) => batch.delete(d.ref))
  }
  await batch.commit()
}

/**
 * Replaces this workspace's sample data with a fresh set. Clears prior sample docs first (so
 * re-running doesn't accumulate), then writes the new sessions + tasks in one batch. Real sessions
 * are never touched. The Home/Sessions/Calendar/Tasks live listeners reflect it immediately.
 */
export async function seedLiveSampleData(workspaceId: string, createdBy: string): Promise<void> {
  await clearLiveSampleData(workspaceId)
  const db = getDb()
  const batch = writeBatch(db)
  const { sessions, tasks } = buildSampleDocs(workspaceId, createdBy)
  for (const s of sessions) batch.set(doc(db, 'sessions', s.id), s.data)
  for (const t of tasks) batch.set(doc(db, 'tasks', t.id), t.data)
  await batch.commit()
}
