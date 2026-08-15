import type { Notification, NotificationType, Person, Project, SessionRecord, Task } from '../types'
import { daysFromNow, hoursFromNow } from './date-helpers'

const TYPE_CYCLE: NotificationType[] = [
  'session-processed',
  'task-assigned',
  'decision-approved',
  'mention',
  'project-update',
  'review-required',
]

function personName(people: Person[], id?: string): string {
  return (id && people.find((p) => p.id === id)?.name) || 'Someone'
}

function buildNotification(
  index: number,
  type: NotificationType,
  timestamp: string,
  people: Person[],
  tasks: Task[],
  sessions: SessionRecord[],
  projects: Project[],
): Notification {
  const task = tasks[index % tasks.length]
  const session = sessions[index % sessions.length]
  const project = projects[index % projects.length]
  const actor = people[(index * 5) % people.length]

  switch (type) {
    case 'session-processed':
      return {
        id: `notification-${index}`,
        type,
        title: 'Session processed',
        description: `"${session.title}" has been transcribed and summarized.`,
        timestamp,
        read: index % 3 !== 0,
        refType: 'session',
        refId: session.id,
      }
    case 'task-assigned':
      return {
        id: `notification-${index}`,
        type,
        title: 'Task assigned to you',
        description: `${personName(people, actor.id)} assigned you "${task.title}".`,
        timestamp,
        read: index % 3 !== 0,
        actorId: actor.id,
        refType: 'task',
        refId: task.id,
      }
    case 'decision-approved':
      return {
        id: `notification-${index}`,
        type,
        title: 'Decision approved',
        description: `A decision from "${session.title}" was approved.`,
        timestamp,
        read: index % 3 !== 0,
        refType: 'session',
        refId: session.id,
      }
    case 'mention':
      return {
        id: `notification-${index}`,
        type,
        title: 'You were mentioned',
        description: `${personName(people, actor.id)} mentioned you in "${session.title}".`,
        timestamp,
        read: index % 3 !== 0,
        actorId: actor.id,
        refType: 'session',
        refId: session.id,
      }
    case 'project-update':
      return {
        id: `notification-${index}`,
        type,
        title: 'Project updated',
        description: `"${project.name}" progress was updated to ${project.progressPct}%.`,
        timestamp,
        read: index % 3 !== 0,
        refType: 'project',
        refId: project.id,
      }
    case 'review-required':
    default:
      return {
        id: `notification-${index}`,
        type: 'review-required',
        title: 'Review required',
        description: `"${session.title}" needs human verification before it's finalized.`,
        timestamp,
        read: index % 3 !== 0,
        refType: 'session',
        refId: session.id,
      }
  }
}

/** 40 notifications spread across today / yesterday / earlier, each referencing a real record. */
export function generateSampleNotifications(
  people: Person[],
  tasks: Task[],
  sessions: SessionRecord[],
  projects: Project[],
): Notification[] {
  const count = 40
  return Array.from({ length: count }, (_, i) => {
    const type = TYPE_CYCLE[i % TYPE_CYCLE.length]
    // First third "today" (hours ago), next third "yesterday", rest spread over the last two weeks.
    const timestamp =
      i < count / 3
        ? hoursFromNow(-(i + 1)).toISOString()
        : i < (count * 2) / 3
          ? daysFromNow(-1, 8 + (i % 10)).toISOString()
          : daysFromNow(-2 - (i % 12), 9 + (i % 8)).toISOString()

    return buildNotification(i, type, timestamp, people, tasks, sessions, projects)
  })
}
