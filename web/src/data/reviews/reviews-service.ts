import { getWorkspaceData, saveWorkspaceData } from '../workspace-repository'
import type { Decision, Person, Project, Question, Risk, SessionRecord, WorkspaceData } from '../types'
import { formatDateLabel, formatDueLabel, formatFullDateTime } from '../home/format'
import { generateTranscript } from '../sessions/transcript'
import type { SessionDecisionItem, SessionQuestionItem, SessionTaskItem } from '../sessions/types'
import type { ReviewDetailData, ReviewListItem, ReviewsListData } from './types'
import type { ReviewStatusValue } from '@/components/recall/review-status'

function projectName(projects: Project[], id?: string): string | undefined {
  return id ? projects.find((p) => p.id === id)?.name : undefined
}

function personName(people: Person[], id?: string): string | undefined {
  return id ? people.find((p) => p.id === id)?.name : undefined
}

function sessionConfidence(session: SessionRecord, decisions: Decision[]): number {
  const sessionDecisions = decisions.filter((d) => d.sourceSessionId === session.id && d.confidence !== undefined)
  if (sessionDecisions.length === 0) return 70
  return Math.round(sessionDecisions.reduce((sum, d) => sum + (d.confidence ?? 0), 0) / sessionDecisions.length)
}

function sessionIssuesFound(session: SessionRecord, questions: Question[], risks: Risk[]): number {
  return questions.filter((q) => q.sourceSessionId === session.id).length + risks.filter((r) => r.sourceSessionId === session.id).length
}

function reviewableSessions(data: WorkspaceData): SessionRecord[] {
  return data.sessions.filter((s) => s.reviewStatus !== undefined)
}

export function getReviewsListData(): ReviewsListData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const { projects, decisions, questions, risks } = data

  const reviews: ReviewListItem[] = reviewableSessions(data)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((s) => ({
      id: s.id,
      sessionId: s.id,
      title: s.title,
      projectName: projectName(projects, s.projectId),
      confidence: sessionConfidence(s, decisions),
      issuesFound: sessionIssuesFound(s, questions, risks),
      status: s.reviewStatus ?? 'pending',
      dateLabel: formatDateLabel(s.date),
      rawDate: s.date,
    }))

  return { reviews }
}

function buildDetail(session: SessionRecord, data: WorkspaceData): ReviewDetailData {
  const { people, projects, decisions, tasks, questions } = data
  const sessionDecisions = decisions.filter((d) => d.sourceSessionId === session.id)
  const sessionTasks = tasks.filter((t) => t.sourceSessionId === session.id)
  const sessionQuestions = questions.filter((q) => q.sourceSessionId === session.id)

  const decisionItems: SessionDecisionItem[] = sessionDecisions.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    ownerName: personName(people, d.ownerId),
    confidence: d.confidence,
    timestampLabel: formatFullDateTime(d.createdAt),
    projectName: projectName(projects, d.projectId),
    linkedTaskCount: d.linkedTaskIds.length,
  }))

  const taskItems: SessionTaskItem[] = sessionTasks.map((t) => ({
    id: t.id,
    title: t.title,
    assigneeName: personName(people, t.assigneeId),
    priority: t.priority,
    status: t.status,
    dueDateLabel: formatDueLabel(t.dueDate),
  }))

  const questionItems: SessionQuestionItem[] = sessionQuestions.map((q) => ({
    id: q.id,
    title: q.title,
    ownerName: personName(people, q.ownerId),
    projectName: projectName(projects, q.projectId),
    timestampLabel: formatFullDateTime(q.createdAt),
  }))

  return {
    id: session.id,
    sessionId: session.id,
    title: session.title,
    projectName: projectName(projects, session.projectId),
    status: session.reviewStatus ?? 'pending',
    confidence: sessionConfidence(session, decisions),
    dateLabel: formatFullDateTime(session.date),
    summary:
      session.summary ||
      generateTranscript(session, people, session.participantIds.map((id) => personName(people, id)).filter((n): n is string => Boolean(n)), sessionDecisions, sessionTasks, sessionQuestions)[0]
        ?.text ||
      '',
    decisions: decisionItems,
    tasks: taskItems,
    questions: questionItems,
  }
}

export function getReviewDetailData(sessionId: string): ReviewDetailData | null | 'not-found' {
  const data = getWorkspaceData()
  if (!data) return null
  const session = data.sessions.find((s) => s.id === sessionId && s.reviewStatus !== undefined)
  if (!session) return 'not-found'
  return buildDetail(session, data)
}

/** Approving also clears the session's needs-review status — an approved review no longer needs attention elsewhere in the app. */
export function setReviewStatus(sessionId: string, status: ReviewStatusValue): ReviewDetailData | null {
  const data = getWorkspaceData()
  if (!data) return null
  const updated: WorkspaceData = {
    ...data,
    sessions: data.sessions.map((s) =>
      s.id === sessionId ? { ...s, reviewStatus: status, status: status === 'approved' && s.status === 'needs-review' ? 'ready' : s.status } : s,
    ),
  }
  saveWorkspaceData(updated)
  const session = updated.sessions.find((s) => s.id === sessionId)
  return session ? buildDetail(session, updated) : null
}
