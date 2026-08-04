import { describe, expect, it } from 'vitest'
import {
  detectTimezone,
  formatDateExample,
  formatTimeExample,
  suggestCountry,
  suggestDateFormat,
  suggestLanguage,
  suggestTimeFormat,
} from './regional'

describe('timezone detection', () => {
  it('returns an IANA zone string from Intl', () => {
    // jsdom/node exposes a real Intl time zone.
    expect(typeof detectTimezone()).toBe('string')
  })
})

describe('language suggestion (only the 4 supported languages)', () => {
  it('maps supported locales to their base code', () => {
    expect(suggestLanguage('en-US')).toBe('en')
    expect(suggestLanguage('sq-AL')).toBe('sq') // Albanian
    expect(suggestLanguage('de-AT')).toBe('de')
    expect(suggestLanguage('fr-CA')).toBe('fr')
  })

  it('never invents a fifth language', () => {
    expect(suggestLanguage('es-ES')).toBeNull()
    expect(suggestLanguage('pt-BR')).toBeNull()
    expect(suggestLanguage('')).toBeNull()
  })
})

describe('country suggestion', () => {
  it('extracts a valid ISO region from the locale', () => {
    expect(suggestCountry('en-US')).toBe('US')
    expect(suggestCountry('sq-AL')).toBe('AL')
  })

  it('returns null when there is no region or it is unknown', () => {
    expect(suggestCountry('en')).toBeNull()
    expect(suggestCountry('xx-ZZ')).toBeNull()
  })
})

describe('date/time format suggestion', () => {
  it('suggests US conventions for US locales, ISO-ish elsewhere', () => {
    expect(suggestDateFormat('en-US')).toBe('MM/DD/YYYY')
    expect(suggestTimeFormat('en-US')).toBe('12h')
    expect(suggestDateFormat('en-GB')).toBe('DD/MM/YYYY')
    expect(suggestTimeFormat('de-DE')).toBe('24h')
  })
})

describe('format examples', () => {
  const date = new Date(2026, 0, 9, 15, 4) // 2026-01-09 15:04 local

  it('renders each date format', () => {
    expect(formatDateExample('DD/MM/YYYY', date)).toBe('09/01/2026')
    expect(formatDateExample('MM/DD/YYYY', date)).toBe('01/09/2026')
    expect(formatDateExample('YYYY-MM-DD', date)).toBe('2026-01-09')
  })

  it('renders 12h and 24h times', () => {
    expect(formatTimeExample('24h', date)).toBe('15:04')
    expect(formatTimeExample('12h', date)).toBe('3:04 PM')
  })
})
