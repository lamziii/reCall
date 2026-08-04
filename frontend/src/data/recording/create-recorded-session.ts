import { getWorkspaceData, saveWorkspaceData } from '../workspace-repository'
import type { Decision, Question, Risk, SessionRecord, Task } from '../types'
import { saveRecordingAudio } from './audio-storage-service'
import type { FinalizedSegment } from './recording-types'

export interface CreateRecordedSessionInput {
  title: string
  projectId?: string
  language: string
  durationSeconds: number
  segments: FinalizedSegment[]
  audioBlob: Blob | null
  mimeType: string
}

function formatOffsetLabel(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** No backend transcript analysis exists yet, so a freshly recorded session gets placeholder follow-ups instead of an empty review page. */
function buildDummyFollowUps(sessionId: string, ownerId: string, createdAt: string) {
  const decisionId = `${sessionId}-decision-1`
  const taskId = `${sessionId}-task-1`

  const decisions: Decision[] = [
    {
      id: decisionId,
      title: 'Proceed with the approach discussed in this session',
      status: 'proposed',
      ownerId,
      sourceSessionId: sessionId,
      confidence: 70,
      createdAt,
      linkedTaskIds: [taskId],
    },
  ]

  const tasks: Task[] = [
    { id: taskId, title: 'Follow up on the decision from this session', sourceSessionId: sessionId, assigneeId: ownerId, status: 'todo', priority: 'medium', relatedDecisionId: decisionId },
    { id: `${sessionId}-task-2`, title: 'Share session notes with the team', sourceSessionId: sessionId, assigneeId: ownerId, status: 'todo', priority: 'low' },
  ]

  const questions: Question[] = [
    { id: `${sessionId}-question-1`, title: 'Confirm timeline with stakeholders', ownerId, severity: 'medium', sourceSessionId: sessionId, status: 'open', createdAt },
  ]

  const risks: Risk[] = [
    { id: `${sessionId}-risk-1`, title: 'Scope may creep if requirements shift', ownerId, severity: 'medium', sourceSessionId: sessionId, status: 'open', createdAt },
  ]

  const insights = ['Key follow-ups were identified and assigned.', 'One open question needs stakeholder input before next steps.']
  const summary = 'This session covered the discussion captured in the live transcript. Follow-up tasks and an open question were logged for tracking.'

  return { decisions, tasks, questions, risks, insights, summary }
}

/** Saves a completed live recording as a real session in the workspace repository. Returns the new session id. */
export async function createRecordedSession(input: CreateRecordedSessionInput): Promise<string> {
  const data = getWorkspaceData()
  if (!data) throw new Error('No workspace found.')

  const id = crypto.randomUUID()
  const now = new Date()
  const durationMinutes = Math.max(1, Math.round(input.durationSeconds / 60))

  const transcript: SessionRecord['transcript'] = input.segments.map((segment, index) => ({
    id: `${id}-t${index}`,
    speakerName: 'You',
    timestampLabel: formatOffsetLabel(segment.offsetSeconds),
    offsetMinutes: segment.offsetSeconds / 60,
    text: segment.text,
  }))

  const followUps = buildDummyFollowUps(id, data.workspace.currentUserId, now.toISOString())

  const session: SessionRecord = {
    id,
    title: input.title.trim() || 'Untitled session',
    projectId: input.projectId || undefined,
    date: now.toISOString(),
    durationMinutes,
    participantIds: [data.workspace.currentUserId],
    status: 'ready',
    summary: followUps.summary,
    decisionIds: followUps.decisions.map((d) => d.id),
    taskIds: followUps.tasks.map((t) => t.id),
    questionIds: followUps.questions.map((q) => q.id),
    riskIds: followUps.risks.map((r) => r.id),
    insights: followUps.insights,
    timeline: [
      { label: 'Session started', offsetMinutes: 0 },
      { label: 'Session ended', offsetMinutes: durationMinutes },
    ],
    transcript,
    source: 'live-recording',
    createdBy: data.workspace.currentUserId,
    language: input.language,
    audio: input.audioBlob ? { mimeType: input.mimeType, durationSeconds: input.durationSeconds } : undefined,
  }

  if (input.audioBlob) {
    await saveRecordingAudio(id, input.audioBlob)
  }

  saveWorkspaceData({
    ...data,
    sessions: [...data.sessions, session],
    decisions: [...data.decisions, ...followUps.decisions],
    tasks: [...data.tasks, ...followUps.tasks],
    questions: [...data.questions, ...followUps.questions],
    risks: [...data.risks, ...followUps.risks],
  })
  return id
}
