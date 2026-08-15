import type { Decision, Person, Question, SessionRecord, Task } from '../types'
import { formatTimeLabel } from '../home/format'
import type { TranscriptEntry } from './types'

function personName(people: Person[], id?: string): string | undefined {
  return id ? people.find((p) => p.id === id)?.name : undefined
}

/**
 * Turns a session's own summary/insights/decisions/tasks/questions into dialogue-shaped
 * transcript turns. No transcript exists in the sample data — this derives entirely from
 * fields that do, rather than inventing new sample content.
 */
export function generateTranscript(
  session: SessionRecord,
  people: Person[],
  participantNames: string[],
  decisions: Decision[],
  tasks: Task[],
  questions: Question[],
): TranscriptEntry[] {
  if (participantNames.length === 0) return []

  const start = new Date(session.date)
  const duration = session.durationMinutes
  let cursor = 0

  function turn(speaker: string, offsetMinutes: number, text: string): TranscriptEntry {
    const time = new Date(start.getTime() + offsetMinutes * 60_000)
    return {
      id: `${session.id}-t${cursor}`,
      speakerName: speaker,
      offsetMinutes,
      timestampLabel: formatTimeLabel(time.toISOString()),
      text,
    }
  }

  const speakerAt = (n: number) => participantNames[n % participantNames.length]

  const entries: TranscriptEntry[] = []
  entries.push(turn(speakerAt(cursor++), 0, "Thanks for joining — let's get into it."))

  const summarySentences = session.summary.split(/(?<=[.!?])\s+/).filter(Boolean)
  summarySentences.forEach((sentence, idx) => {
    entries.push(turn(speakerAt(cursor++), Math.min(2 + idx * 3, Math.max(duration - 2, 2)), sentence))
  })

  session.insights.forEach((insight, idx) => {
    entries.push(turn(speakerAt(cursor++), Math.min(Math.round(duration * 0.4) + idx * 3, Math.max(duration - 2, 2)), insight))
  })

  decisions.forEach((decision, idx) => {
    const owner = personName(people, decision.ownerId) ?? speakerAt(cursor++)
    entries.push(turn(owner, Math.min(Math.round(duration * 0.65) + idx * 3, Math.max(duration - 1, 1)), `Let's lock this in: ${decision.title}`))
  })

  questions.forEach((question, idx) => {
    entries.push(turn(speakerAt(cursor++), Math.min(Math.round(duration * 0.78) + idx * 2, Math.max(duration - 1, 1)), question.title))
  })

  tasks.forEach((task, idx) => {
    const assignee = personName(people, task.assigneeId)
    const text = assignee ? `${assignee}, can you own "${task.title}"?` : `Someone should pick up "${task.title}".`
    entries.push(turn(speakerAt(cursor++), Math.min(Math.round(duration * 0.88) + idx * 2, Math.max(duration - 1, 1)), text))
  })

  entries.push(turn(speakerAt(cursor++), Math.max(duration - 1, 1), "Great progress — I'll send notes and next steps after this."))

  return entries.sort((a, b) => a.offsetMinutes - b.offsetMinutes)
}
