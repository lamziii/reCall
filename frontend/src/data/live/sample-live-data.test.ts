import { describe, expect, it } from 'vitest'
import { buildSampleDocs } from './sample-live-data'
import { toLiveHomeData } from './dashboard-mappers'
import type { LiveSessionDoc, LiveTaskDoc } from './types'

const NOW = new Date('2026-08-04T12:00:00Z').getTime()

describe('buildSampleDocs', () => {
  const { sessions, tasks } = buildSampleDocs('ws-abc', 'user-1', NOW)

  it('produces several completed sessions with deterministic, workspace-scoped ids', () => {
    expect(sessions.length).toBeGreaterThanOrEqual(4)
    expect(sessions.every((s) => s.id.startsWith('ws-abc-sample-'))).toBe(true)
    expect(sessions.every((s) => s.data.workspace_id === 'ws-abc')).toBe(true)
    expect(sessions.every((s) => s.data.status === 'completed' && s.data.review_status === 'completed')).toBe(true)
    expect(sessions.every((s) => (s.data.review_summary as string).length > 0)).toBe(true)
    expect(sessions.every((s) => s.data.sample === true)).toBe(true)
  })

  it('links every task to a real seeded session and uses valid enums', () => {
    const ids = new Set(sessions.map((s) => s.id))
    for (const t of tasks) {
      expect(ids.has(t.data.session_id as string)).toBe(true)
      expect(['red', 'amber', 'gray']).toContain(t.data.priority)
      expect(['todo', 'in_progress', 'done']).toContain(t.data.status)
      expect(t.data.owner).toBeTruthy() // never null; defaults to a name or "Unassigned"
    }
  })

  it('includes at least one overdue and one upcoming dated task', () => {
    const deadlines = tasks.map((t) => t.data.deadline as string | null).filter(Boolean) as string[]
    const today = new Date(NOW).toISOString().slice(0, 10)
    expect(deadlines.some((d) => d < today)).toBe(true) // overdue
    expect(deadlines.some((d) => d > today)).toBe(true) // upcoming
  })

  it('feeds a populated Home dashboard (no empty state)', () => {
    // The Home mapper consumes exactly these Firestore doc shapes.
    const liveSessions = sessions.map((s) => ({ id: s.id, ...s.data }) as unknown as LiveSessionDoc)
    const liveTasks = tasks.map((t) => ({ id: t.id, ...t.data }) as unknown as LiveTaskDoc)
    const home = toLiveHomeData(liveSessions, liveTasks, { userName: 'Uvejs', workspaceName: 'Recall' })

    expect(home.recentSessions.length).toBeGreaterThan(0)
    expect(home.recentActivity.length).toBeGreaterThan(0)
    expect(home.needsAttention.length).toBeGreaterThan(0)
    expect(home.primaryAttention).not.toBeNull()
  })
})
