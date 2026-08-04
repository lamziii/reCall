import { describe, expect, it } from 'vitest'
import { SEED_TASKS, SEED_VERSION, seedTaskId } from './seed-data'
import { DEV_CATEGORIES, DEV_PRIORITIES } from './types'

describe('seed data', () => {
  it('has a positive seed version', () => {
    expect(SEED_VERSION).toBeGreaterThanOrEqual(1)
  })

  it('every seed task has a unique deterministic id (no duplicates possible)', () => {
    const ids = SEED_TASKS.map((t) => seedTaskId(t.slug))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every slug is unique', () => {
    const slugs = SEED_TASKS.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('uses only valid categories and priorities', () => {
    for (const t of SEED_TASKS) {
      expect(DEV_CATEGORIES).toContain(t.category)
      expect(DEV_PRIORITIES).toContain(t.priority)
    }
  })

  it('does NOT seed already-complete onboarding work (avoids obsolete tasks)', () => {
    const titles = SEED_TASKS.map((t) => t.title.toLowerCase())
    // These onboarding items were completed in the onboarding build — they must not reappear.
    expect(titles.some((t) => t.includes('persist onboarding progress'))).toBe(false)
    expect(titles.some((t) => t.includes('detect time zone'))).toBe(false)
    expect(titles.some((t) => t.includes('prevent duplicate workspace'))).toBe(false)
  })

  it('covers the core foundation migration work', () => {
    const slugs = SEED_TASKS.map((t) => t.slug)
    expect(slugs).toContain('migrate-projects')
    expect(slugs).toContain('migrate-reviews')
    expect(slugs).toContain('migrate-notifications')
  })
})
