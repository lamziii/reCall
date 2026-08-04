import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_EXPECTED_LANGUAGES, loadExpectedLanguages, saveExpectedLanguages } from './transcription-languages'

describe('expected meeting languages (persistence)', () => {
  beforeEach(() => window.localStorage.clear())

  it('defaults a new user to Albanian + English', () => {
    expect(loadExpectedLanguages()).toEqual(DEFAULT_EXPECTED_LANGUAGES)
    expect(DEFAULT_EXPECTED_LANGUAGES).toEqual(['sq', 'en'])
  })

  it('round-trips the last selection so it becomes the next default', () => {
    saveExpectedLanguages(['sq', 'de'])
    expect(loadExpectedLanguages()).toEqual(['sq', 'de'])
  })

  it('drops unsupported codes and falls back to the default when nothing valid remains', () => {
    window.localStorage.setItem('recall:expected-languages', JSON.stringify(['es', 'it']))
    expect(loadExpectedLanguages()).toEqual(DEFAULT_EXPECTED_LANGUAGES)
    window.localStorage.setItem('recall:expected-languages', JSON.stringify(['en', 'zz']))
    expect(loadExpectedLanguages()).toEqual(['en'])
  })
})
