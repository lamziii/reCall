import type { Decision, Question, Risk, SampleMeta, WorkspaceData } from '../types'
import { generateSamplePeople, PERSON_IDS } from './sample-people'
import { generateSampleProjects } from './sample-projects'
import { generateSampleSessions } from './sample-sessions'
import { generateSampleDecisions } from './sample-decisions'
import { generateSampleTasks } from './sample-tasks'
import { generateSampleQuestions, generateSampleRisks } from './sample-questions-risks'
import { generateSampleActivity } from './sample-activity'

export const SAMPLE_DATA_VERSION = 1

function tag<T extends object>(record: T, meta: SampleMeta): T & { _sample: SampleMeta } {
  return { ...record, _sample: meta }
}

/** Builds one coherent, internally-consistent sample workspace, anchored to the current date. */
export function generateSampleWorkspace(batchId: string): WorkspaceData {
  const now = new Date().toISOString()
  const meta: SampleMeta = { source: 'sample-data', sampleDataVersion: SAMPLE_DATA_VERSION, sampleDataBatchId: batchId, createdAt: now }

  const people = generateSamplePeople()
  const projects = generateSampleProjects()
  const sessions = generateSampleSessions()
  const sessionDateById = new Map(sessions.map((s) => [s.id, s.date]))

  const decisions: Decision[] = generateSampleDecisions().map((d) => ({
    ...d,
    createdAt: d.sourceSessionId ? (sessionDateById.get(d.sourceSessionId) ?? now) : now,
  }))
  const tasks = generateSampleTasks()
  const questions: Question[] = generateSampleQuestions().map((q) => ({
    ...q,
    createdAt: q.sourceSessionId ? (sessionDateById.get(q.sourceSessionId) ?? now) : now,
  }))
  const risks: Risk[] = generateSampleRisks().map((r) => ({
    ...r,
    createdAt: r.sourceSessionId ? (sessionDateById.get(r.sourceSessionId) ?? now) : now,
  }))
  const activity = generateSampleActivity()

  // Derive each session's child-record ids from the records themselves, rather than
  // hand-authoring both directions and risking them drifting out of sync.
  const sessionsWithLinks = sessions.map((session) => ({
    ...session,
    decisionIds: decisions.filter((d) => d.sourceSessionId === session.id).map((d) => d.id),
    taskIds: tasks.filter((t) => t.sourceSessionId === session.id).map((t) => t.id),
    questionIds: questions.filter((q) => q.sourceSessionId === session.id).map((q) => q.id),
    riskIds: risks.filter((r) => r.sourceSessionId === session.id).map((r) => r.id),
  }))

  const decisionsWithLinks = decisions.map((decision) => ({
    ...decision,
    linkedTaskIds: tasks.filter((t) => t.relatedDecisionId === decision.id).map((t) => t.id),
  }))

  return {
    workspace: tag(
      {
        id: 'northstar',
        name: 'Northstar',
        plan: 'Pro trial',
        industry: 'Software',
        teamSize: 12,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
        currentUserId: PERSON_IDS.sarah,
      },
      meta,
    ),
    people: people.map((p) => tag(p, meta)),
    projects: projects.map((p) => tag(p, meta)),
    sessions: sessionsWithLinks.map((s) => tag(s, meta)),
    tasks: tasks.map((t) => tag(t, meta)),
    decisions: decisionsWithLinks.map((d) => tag(d, meta)),
    questions: questions.map((q) => tag(q, meta)),
    risks: risks.map((r) => tag(r, meta)),
    activity: activity.map((a) => tag(a, meta)),
  }
}
