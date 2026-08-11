import { describe, expect, it } from 'vitest'
import { DEFAULT_RECALL_PREFERENCES } from './defaults'
import { mergeSection } from './update'
import { resolvePreferences } from './resolve'
import { formatRecallDate, formatRecallTime, setFormatPreferences } from './format'

describe('resolvePreferences (motion precedence)', () => {
  const base = DEFAULT_RECALL_PREFERENCES

  it('normal: page/hover/decorative all run', () => {
    const r = resolvePreferences(base, { systemReduceMotion: false })
    expect(r.reduceMotion).toBe(false)
    expect(r.pageTransitions).toBe(true)
    expect(r.hoverAnimations).toBe(true)
  })

  it('Animations off dominates every sub-toggle', () => {
    const prefs = mergeSection(base, 'appearance', { animations: { ...base.appearance.animations, enabled: false } })
    const r = resolvePreferences(prefs, { systemReduceMotion: false })
    expect(r.reduceMotion).toBe(true)
    expect(r.pageTransitions).toBe(false)
    expect(r.hoverAnimations).toBe(false)
    expect(r.decorativeEffects).toBe(false)
  })

  it('user Reduce motion forces motion off even with animations enabled', () => {
    const prefs = mergeSection(base, 'appearance', { animations: { ...base.appearance.animations, reduceMotion: true } })
    const r = resolvePreferences(prefs, { systemReduceMotion: false })
    expect(r.reduceMotion).toBe(true)
    expect(r.pageTransitions).toBe(false)
  })

  it('OS reduced-motion overrides a permissive user choice', () => {
    // User left everything on, but the OS asks for reduced motion → accessibility wins.
    const r = resolvePreferences(base, { systemReduceMotion: true })
    expect(r.reduceMotion).toBe(true)
    expect(r.pageTransitions).toBe(false)
  })
})

describe('formatRecallDate', () => {
  const d = new Date(2026, 2, 5) // Mar 5 2026, local

  it('MM/DD/YYYY', () => {
    setFormatPreferences({ dateFormat: 'mdy', timeFormat: '12h' })
    expect(formatRecallDate(d)).toBe('03/05/2026')
  })
  it('DD/MM/YYYY', () => {
    setFormatPreferences({ dateFormat: 'dmy', timeFormat: '12h' })
    expect(formatRecallDate(d)).toBe('05/03/2026')
  })
  it('YYYY-MM-DD', () => {
    setFormatPreferences({ dateFormat: 'iso', timeFormat: '12h' })
    expect(formatRecallDate(d)).toBe('2026-03-05')
  })
  it('withYear:false drops the year', () => {
    setFormatPreferences({ dateFormat: 'mdy', timeFormat: '12h' })
    expect(formatRecallDate(d, { withYear: false })).toBe('03/05')
  })
  it('relative: today reads "Today"', () => {
    setFormatPreferences({ dateFormat: 'relative', timeFormat: '12h' })
    expect(formatRecallDate(new Date())).toBe('Today')
  })
  it('an override mode wins over the stored preference', () => {
    setFormatPreferences({ dateFormat: 'mdy', timeFormat: '12h' })
    expect(formatRecallDate(d, { mode: 'iso' })).toBe('2026-03-05')
  })
  it('invalid dates format to empty string, never throw', () => {
    expect(formatRecallDate('not a date')).toBe('')
  })
})

describe('formatRecallTime', () => {
  const noon = new Date(2026, 2, 5, 13, 5) // 1:05 PM

  it('12-hour uses AM/PM', () => {
    setFormatPreferences({ dateFormat: 'mdy', timeFormat: '12h' })
    expect(formatRecallTime(noon)).toMatch(/1:05\s?PM/i)
  })
  it('24-hour has no AM/PM', () => {
    setFormatPreferences({ dateFormat: 'mdy', timeFormat: '24h' })
    const out = formatRecallTime(noon)
    expect(out).toMatch(/13:05/)
    expect(out).not.toMatch(/PM/i)
  })
})
