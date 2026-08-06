import { describe, expect, it } from 'vitest'
import { buildTaskDetailPreview } from './task-detail-preview'
import type { TaskListItem } from './types'

function item(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    id: 't1',
    title: 'Send the revised roadmap',
    priority: 'high',
    status: 'todo',
    isOverdue: false,
    ...overrides,
  }
}

describe('buildTaskDetailPreview', () => {
  it('carries the real list fields straight through', () => {
    const d = buildTaskDetailPreview(item({ assigneeName: 'Uvejs', dueDateRaw: '2026-08-10', projectName: 'Mobile v2', projectId: 'p1' }))
    expect(d.id).toBe('t1')
    expect(d.title).toBe('Send the revised roadmap')
    expect(d.priority).toBe('high')
    expect(d.status).toBe('todo')
    expect(d.assigneeName).toBe('Uvejs')
    expect(d.dueDateRaw).toBe('2026-08-10')
    expect(d.projectName).toBe('Mobile v2')
  })

  it('synthesizes dummy description + activity so the panel is always populated', () => {
    const d = buildTaskDetailPreview(item())
    expect(d.description.length).toBeGreaterThan(0)
    expect(d.activity.length).toBeGreaterThanOrEqual(3)
    expect(d.activity.every((a) => a.id && a.label && a.timestampLabel)).toBe(true)
  })

  it('adds a meeting excerpt only when the task came from a session', () => {
    expect(buildTaskDetailPreview(item({ sessionTitle: 'Q3 Sync', assigneeName: 'Lorik' })).conversationExcerpt).toBeTruthy()
    expect(buildTaskDetailPreview(item({ sessionTitle: undefined })).conversationExcerpt).toBeUndefined()
  })

  it('handles an unassigned task without crashing', () => {
    const d = buildTaskDetailPreview(item({ assigneeName: undefined }))
    expect(d.description).toContain('the team')
    expect(d.activity.some((a) => a.label === 'Left unassigned')).toBe(true)
  })
})
