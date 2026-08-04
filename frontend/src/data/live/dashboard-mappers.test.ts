import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import { toLiveHomeData, toLiveCalendarData } from './dashboard-mappers'
import { toSessionsListData, toTasksListData, liveSessionStatus } from './mappers'
import type { LiveSessionDoc, LiveTaskDoc } from './types'

const nowIso = new Date().toISOString()
const todayDate = new Date().toISOString().slice(0, 10) // YYYY-MM-DD for a task deadline "today"
const fakeTs = (iso: string) => ({ toDate: () => new Date(iso) }) as unknown as Timestamp

function session(over: Partial<LiveSessionDoc> = {}): LiveSessionDoc {
  return {
    id: 's1',
    workspace_id: 'w',
    title: 'Weekly sync',
    created_at: fakeTs(nowIso),
    review_status: 'completed',
    review_summary: 'We aligned on the roadmap.',
    tasks_count: 2,
    decisions_count: 1,
    participants: ['Uvejs', 'Sam'],
    ...over,
  }
}
function task(over: Partial<LiveTaskDoc> = {}): LiveTaskDoc {
  return { id: 's1-t0', workspace_id: 'w', project_id: null, session_id: 's1', title: 'Do X', owner: 'Sam', deadline: null, priority: 'amber', status: 'todo', ...over }
}

describe('session row enrichment (toSessionsListData)', () => {
  it('uses the AI summary + denormalized counts + a real date group', () => {
    const [row] = toSessionsListData([session()]).sessions
    expect(row.summaryPreview).toBe('We aligned on the roadmap.')
    expect(row.tasksCount).toBe(2)
    expect(row.decisionsCount).toBe(1)
    expect(row.dateGroup).toBe('today')
    expect(row.status).toBe('ready')
  })

  it('never shows a raw id/placeholder while processing', () => {
    const [row] = toSessionsListData([session({ review_status: undefined, review_summary: null, transcription_status: 'processing' })]).sessions
    expect(row.status).toBe('processing')
    expect(row.summaryPreview).toBe('Analyzing this conversation…')
  })
})

describe('liveSessionStatus (pipeline states)', () => {
  it('reports transcription then analysis states', () => {
    expect(liveSessionStatus(session({ transcription_status: 'pending' }))).toBe('processing')
    expect(liveSessionStatus(session({ transcription_status: 'failed' }))).toBe('failed')
    expect(liveSessionStatus(session({ review_status: 'failed' }))).toBe('failed')
    expect(liveSessionStatus(session({ review_status: 'completed' }))).toBe('ready')
  })
})

describe('toTasksListData', () => {
  it('derives distinct assignee options, excluding the Unassigned sentinel', () => {
    const data = toTasksListData([task({ owner: 'Sam' }), task({ id: 't2', owner: 'Unassigned' }), task({ id: 't3', owner: 'Ana' })], new Map())
    expect(data.assigneeOptions.map((o) => o.name)).toEqual(['Ana', 'Sam'])
  })
  it('falls back to the denormalized source session title', () => {
    const [item] = toTasksListData([task({ source_session_title: 'Weekly sync' })], new Map()).tasks
    expect(item.sessionTitle).toBe('Weekly sync')
  })
})

describe('toLiveHomeData (dashboard aggregation)', () => {
  it('summarizes real sessions and open tasks', () => {
    const data = toLiveHomeData([session()], [task({ deadline: todayDate }), task({ id: 's1-t1', status: 'done' })], { userName: 'Uvejs', workspaceName: 'Recall' })
    expect(data.recentSessions).toHaveLength(1)
    expect(data.recentSessions[0].summaryPreview).toBe('We aligned on the roadmap.')
    // Only the open, dated task surfaces; the done one is excluded.
    expect(data.needsAttention).toHaveLength(1)
    expect(data.recentActivity[0].sentence).toContain('Weekly sync')
  })

  it('primaryAttention prefers a processing session', () => {
    const data = toLiveHomeData([session({ transcription_status: 'processing', review_status: undefined })], [], { userName: 'U', workspaceName: 'R' })
    expect(data.primaryAttention?.kind).toBe('session')
    expect((data.primaryAttention as { reason: string }).reason).toBe('processing')
  })

  it('primaryAttention falls to an overdue task when all sessions are done', () => {
    const data = toLiveHomeData([session()], [task({ deadline: '2020-01-01' })], { userName: 'U', workspaceName: 'R' })
    expect(data.primaryAttention?.kind).toBe('task')
  })
})

describe('toLiveCalendarData (real events from sessions + dated tasks)', () => {
  const now = new Date()
  const data = toLiveCalendarData([session()], [task({ deadline: todayDate }), task({ id: 'done', deadline: todayDate, status: 'done' })], now.getFullYear(), now.getMonth())

  it('renders a 6-week grid and places the session on today', () => {
    expect(data.days).toHaveLength(42)
    const todayCell = data.days.find((d) => d.isToday)
    expect(todayCell?.sessions.some((p) => p.id === 's1')).toBe(true)
  })

  it('places an open dated task on the grid and in the agenda, excluding completed tasks', () => {
    const todayCell = data.days.find((d) => d.isToday)
    expect(todayCell?.sessions.some((p) => p.id === 'task-s1-t0')).toBe(true)
    expect(todayCell?.sessions.some((p) => p.id === 'task-done')).toBe(false)
    expect(data.upcomingDeadlines.some((d) => d.id === 'task-s1-t0')).toBe(true)
    expect(data.upcomingDeadlines.some((d) => d.id === 'task-done')).toBe(false)
  })
})
