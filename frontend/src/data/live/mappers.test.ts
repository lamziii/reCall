import { describe, expect, it } from 'vitest'
import {
  candidateToTaskInput,
  priorityDbToView,
  statusDbToView,
  statusViewToDb,
  taskDocToListItem,
} from './mappers'
import type { CandidateTask } from './review'
import type { LiveTaskDoc } from './types'

function candidate(over: Partial<CandidateTask> = {}): CandidateTask {
  return { title: 'Ship it', owner: 'Sam', deadline: '2026-08-10', priority: 'red', evidence: null, ...over }
}

describe('candidateToTaskInput (promote mapping — Contract 2)', () => {
  it('keeps a valid candidate intact', () => {
    expect(candidateToTaskInput(candidate())).toEqual({
      title: 'Ship it',
      owner: 'Sam',
      deadline: '2026-08-10',
      priority: 'red',
      status: 'todo',
    })
  })

  it('defaults a missing owner to "Unassigned", never null', () => {
    expect(candidateToTaskInput(candidate({ owner: null })).owner).toBe('Unassigned')
    expect(candidateToTaskInput(candidate({ owner: '   ' })).owner).toBe('Unassigned')
  })

  it('normalizes deadline to ISO-or-null (never free text)', () => {
    expect(candidateToTaskInput(candidate({ deadline: null })).deadline).toBeNull()
    expect(candidateToTaskInput(candidate({ deadline: 'next week' })).deadline).toBeNull()
    expect(candidateToTaskInput(candidate({ deadline: '2026-12-01' })).deadline).toBe('2026-12-01')
  })

  it('coerces an unexpected priority to gray', () => {
    expect(candidateToTaskInput(candidate({ priority: 'high' as CandidateTask['priority'] })).priority).toBe('gray')
  })

  it('always starts a promoted task in todo', () => {
    expect(candidateToTaskInput(candidate()).status).toBe('todo')
  })
})

describe('priority / status enum mapping (DB <-> view)', () => {
  it('maps DB priority colors to the badge priority', () => {
    expect(priorityDbToView('red')).toBe('high')
    expect(priorityDbToView('amber')).toBe('medium')
    expect(priorityDbToView('gray')).toBe('low')
  })

  it('round-trips task status across the underscore/hyphen boundary', () => {
    expect(statusDbToView('in_progress')).toBe('in-progress')
    expect(statusViewToDb('in-progress')).toBe('in_progress')
    expect(statusViewToDb(statusDbToView('done'))).toBe('done')
    expect(statusViewToDb(statusDbToView('todo'))).toBe('todo')
  })
})

describe('taskDocToListItem', () => {
  const base: LiveTaskDoc = {
    id: 't1',
    workspace_id: 'ws',
    project_id: null,
    session_id: 's1',
    title: 'Fix bug',
    owner: 'Unassigned',
    deadline: null,
    priority: 'amber',
    status: 'todo',
  }

  it('hides an Unassigned owner from the assignee name', () => {
    expect(taskDocToListItem(base).assigneeName).toBeUndefined()
    expect(taskDocToListItem({ ...base, owner: 'Marcus' }).assigneeName).toBe('Marcus')
  })

  it('flags overdue only for unfinished tasks with a past deadline', () => {
    expect(taskDocToListItem({ ...base, deadline: '2000-01-01' }).isOverdue).toBe(true)
    expect(taskDocToListItem({ ...base, deadline: '2000-01-01', status: 'done' }).isOverdue).toBe(false)
    expect(taskDocToListItem({ ...base, deadline: null }).isOverdue).toBe(false)
  })
})
