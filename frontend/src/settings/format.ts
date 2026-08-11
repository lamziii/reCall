// Central date/time formatting driven by Personalization preferences. One place decides MM/DD/YYYY
// vs DD/MM/YYYY vs YYYY-MM-DD vs Relative, and 12h vs 24h — so every surface is consistent instead of
// each component calling toLocaleDateString with its own options.
//
// A module store holds the current format prefs (published by RecallPreferencesProvider) so that
// low-level, non-React formatters (e.g. data/home/format.ts) can format without a hook. Changes take
// effect on the next render/navigation (date components re-render when their page mounts).
//
// IMPORTANT: this formats CLOCK dates/times only. Durations (01:23:45) are NOT clock time and must
// never go through here.

import { DEFAULT_RECALL_PREFERENCES } from './defaults'
import type { DateFormat, PersonalizationPreferences, TimeFormat } from './types'

let current: { dateFormat: DateFormat; timeFormat: TimeFormat } = {
  dateFormat: DEFAULT_RECALL_PREFERENCES.personalization.dateFormat,
  timeFormat: DEFAULT_RECALL_PREFERENCES.personalization.timeFormat,
}

/** Called by the preferences provider whenever personalization changes. */
export function setFormatPreferences(p: Pick<PersonalizationPreferences, 'dateFormat' | 'timeFormat'>) {
  current = { dateFormat: p.dateFormat, timeFormat: p.timeFormat }
}

function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input)
}

const DAY_MS = 86_400_000
const pad = (n: number) => String(n).padStart(2, '0')

function relativeDate(d: Date): string {
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY_MS)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0 && diff >= -7) return `${-diff} days ago`
  if (diff > 0 && diff <= 7) return `In ${diff} days`
  // Older/further — a readable absolute date rather than "428 days ago".
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export interface FormatDateOptions {
  /** Override the user's preference (rarely needed). */
  mode?: DateFormat
  /** Include the year in numeric formats. Default true. */
  withYear?: boolean
}

/** Formats a clock date per the user's Date format preference. */
export function formatRecallDate(input: Date | string | number, options: FormatDateOptions = {}): string {
  const d = toDate(input)
  if (Number.isNaN(d.getTime())) return ''
  const mode = options.mode ?? current.dateFormat
  const withYear = options.withYear ?? true
  if (mode === 'relative') return relativeDate(d)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (mode === 'iso') return `${y}-${pad(m)}-${pad(day)}`
  if (mode === 'dmy') return withYear ? `${pad(day)}/${pad(m)}/${y}` : `${pad(day)}/${pad(m)}`
  return withYear ? `${pad(m)}/${pad(day)}/${y}` : `${pad(m)}/${pad(day)}` // mdy
}

/** Formats a clock time per the user's Time format preference (12h/24h). Never for durations. */
export function formatRecallTime(input: Date | string | number, options: { mode?: TimeFormat } = {}): string {
  const d = toDate(input)
  if (Number.isNaN(d.getTime())) return ''
  const hour12 = (options.mode ?? current.timeFormat) === '12h'
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12 })
}

export function formatRecallDateTime(input: Date | string | number): string {
  return `${formatRecallDate(input)} · ${formatRecallTime(input)}`
}
