// Client mirror of the server's supported transcription languages (firebase/functions/src/
// transcription/supported-languages.ts). Kept in one place so the recording UI never hardcodes
// codes. These are SOFT preferences — they bias recognition, they do not restrict it.

export const EXPECTED_LANGUAGE_OPTIONS = [
  { code: 'sq', label: 'Albanian' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
] as const

export type ExpectedLanguageCode = (typeof EXPECTED_LANGUAGE_OPTIONS)[number]['code']

export const DEFAULT_EXPECTED_LANGUAGES: ExpectedLanguageCode[] = ['sq', 'en']

const STORAGE_KEY = 'recall:expected-languages'
const VALID = new Set(EXPECTED_LANGUAGE_OPTIONS.map((o) => o.code))

/** The user's last selection (persisted), defaulting to Albanian + English for a new user. */
export function loadExpectedLanguages(): ExpectedLanguageCode[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(raw)) {
      const valid = raw.filter((c): c is ExpectedLanguageCode => typeof c === 'string' && VALID.has(c as ExpectedLanguageCode))
      if (valid.length) return valid
    }
  } catch {
    // ignore malformed storage
  }
  return [...DEFAULT_EXPECTED_LANGUAGES]
}

/** Remembers the selection so it becomes the default for the next session. */
export function saveExpectedLanguages(codes: ExpectedLanguageCode[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(codes))
  } catch {
    // ignore storage failures
  }
}
