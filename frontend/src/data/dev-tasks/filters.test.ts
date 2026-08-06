import { describe, expect, it } from 'vitest'
import { computeDevTaskStats, filterDevTasks, matchesView, INITIAL_FILTERS } from './filters'
import type { DevelopmentTask } from './types'

function task(overrides: Partial<DevelopmentTask>): DevelopmentTask {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    title: overrides.title ?? 'A task',
    description: overrides.description ?? null,
    category: overrides.category ?? 'other',
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'backlog',
    reserved_by: overrides.reserved_by ?? null,
    created_by: overrides.created_by ?? 'system',
    completed_by: overrides.completed_by ?? null,
    created_at: null,
    updated_at: null,
    reserved_at: null,
    completed_at: null,
    order: overrides.order ?? 0,
    ...overrides,
  }
}

const board: DevelopmentTask[] = [
  task({ id: 'a', status: 'backlog', priority: 'critical', title: 'Migrate projects' }),
  task({ id: 'b', status: 'reserved', reserved_by: 'uvejs', priority: 'high' }),
  task({ id: 'c', status: 'in_progress', reserved_by: 'lorik', priority: 'medium' }),
  task({ id: 'd', status: 'in_progress', reserved_by: 'uvejs', priority: 'low' }),
  task({ id: 'e', status: 'completed', reserved_by: 'lorik', completed_by: 'lorik' }),
]

describe('matchesView', () => {
  it('Available = backlog and unreserved', () => {
    expect(matchesView(board[0], 'available', 'uvejs')).toBe(true)
    expect(matchesView(board[1], 'available', 'uvejs')).toBe(false)
  })

  it('Mine = reserved by me and not completed', () => {
    expect(matchesView(board[1], 'mine', 'uvejs')).toBe(true) // reserved by uvejs
    expect(matchesView(board[3], 'mine', 'uvejs')).toBe(true) // in_progress by uvejs
    expect(matchesView(board[2], 'mine', 'uvejs')).toBe(false) // lorik's
    expect(matchesView(board[1], 'mine', null)).toBe(false) // no identity
  })

  it('status views', () => {
    expect(matchesView(board[1], 'reserved', 'uvejs')).toBe(true)
    expect(matchesView(board[2], 'in_progress', 'uvejs')).toBe(true)
    expect(matchesView(board[4], 'completed', 'uvejs')).toBe(true)
  })
})

describe('filterDevTasks', () => {
  it('Available view only shows the unreserved backlog task', () => {
    const out = filterDevTasks(board, { ...INITIAL_FILTERS, view: 'available' }, 'uvejs')
    expect(out.map((t) => t.id)).toEqual(['a'])
  })

  it('Mine view shows uvejs reserved + in-progress', () => {
    const out = filterDevTasks(board, { ...INITIAL_FILTERS, view: 'mine' }, 'uvejs')
    expect(out.map((t) => t.id).sort()).toEqual(['b', 'd'])
  })

  it('person filter matches reserved_by', () => {
    const out = filterDevTasks(board, { ...INITIAL_FILTERS, person: 'lorik' }, 'uvejs')
    expect(out.map((t) => t.id).sort()).toEqual(['c', 'e'])
  })

  it('search matches title (case-insensitive)', () => {
    const out = filterDevTasks(board, { ...INITIAL_FILTERS, query: 'MIGRATE' }, 'uvejs')
    expect(out.map((t) => t.id)).toEqual(['a'])
  })

  it('sorts open before completed, then by priority', () => {
    const out = filterDevTasks(board, INITIAL_FILTERS, 'uvejs')
    expect(out[0].id).toBe('a') // critical, open
    expect(out[out.length - 1].id).toBe('e') // completed last
  })
})

describe('computeDevTaskStats', () => {
  it('counts remaining, in progress, completed, and per-person reservations', () => {
    const s = computeDevTaskStats(board)
    expect(s.total).toBe(5)
    expect(s.completed).toBe(1)
    expect(s.remaining).toBe(4)
    expect(s.inProgress).toBe(2)
    expect(s.uvejsReserved).toBe(2) // b + d
    expect(s.lorikReserved).toBe(1) // c (e is completed, excluded)
  })
})
