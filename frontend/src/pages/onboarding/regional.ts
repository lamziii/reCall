import { SUPPORTED_LANGUAGE_CODES } from './options'
import { isValidCountryCode } from './countries'

/**
 * Region/locale detection helpers for the onboarding preferences step. All best-effort and
 * override-able: we suggest, the user decides. Pure functions (given `Intl`) so they're unit-testable.
 */

/** Detects the device time zone. Returns null when the platform can't resolve one. */
export function detectTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz || null
  } catch {
    return null
  }
}

/** The browser's primary locale, e.g. "en-US". Empty string when unavailable. */
export function browserLocale(): string {
  if (typeof navigator === 'undefined') return ''
  return navigator.language || (navigator.languages && navigator.languages[0]) || ''
}

/**
 * Maps a locale to one of Recall's four supported languages, or null if none matches. Only the
 * base language subtag is considered (e.g. "de-AT" → "de"). Never invents a fifth language.
 */
export function suggestLanguage(locale: string = browserLocale()): string | null {
  const base = (locale || '').toLowerCase().split(/[-_]/)[0]
  return SUPPORTED_LANGUAGE_CODES.includes(base) ? base : null
}

/** Extracts an ISO country code from a locale ("en-US" → "US"), validated against the list. */
export function suggestCountry(locale: string = browserLocale()): string | null {
  const parts = (locale || '').split(/[-_]/)
  const region = parts[1]?.toUpperCase()
  return region && isValidCountryCode(region) ? region : null
}

/**
 * US-style locales conventionally use MM/DD/YYYY and 12-hour clocks; almost everywhere else uses
 * DD/MM/YYYY and 24-hour. This is a *suggestion* the user can change.
 */
export function suggestDateFormat(locale: string = browserLocale()): 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' {
  const region = (locale || '').split(/[-_]/)[1]?.toUpperCase()
  return region === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'
}

export function suggestTimeFormat(locale: string = browserLocale()): '12h' | '24h' {
  const region = (locale || '').split(/[-_]/)[1]?.toUpperCase()
  return region === 'US' ? '12h' : '24h'
}

/** Renders a sample date in the chosen format so the user sees exactly what they're picking. */
export function formatDateExample(format: string, date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = String(date.getFullYear())
  switch (format) {
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`
    case 'DD/MM/YYYY':
    default:
      return `${dd}/${mm}/${yyyy}`
  }
}

export function formatTimeExample(format: string, date: Date = new Date()): string {
  const h24 = date.getHours()
  const min = String(date.getMinutes()).padStart(2, '0')
  if (format === '12h') {
    const period = h24 >= 12 ? 'PM' : 'AM'
    const h12 = h24 % 12 || 12
    return `${h12}:${min} ${period}`
  }
  return `${String(h24).padStart(2, '0')}:${min}`
}

export interface RegionalDefaults {
  language: string
  country: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
}

/** All regional suggestions in one shot, for seeding the preferences step. */
export function detectRegionalDefaults(locale: string = browserLocale()): RegionalDefaults {
  return {
    language: suggestLanguage(locale) ?? 'en',
    country: suggestCountry(locale) ?? '',
    timezone: detectTimezone() ?? '',
    dateFormat: suggestDateFormat(locale),
    timeFormat: suggestTimeFormat(locale),
  }
}
