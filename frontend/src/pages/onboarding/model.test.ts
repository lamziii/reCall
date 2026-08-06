import { describe, expect, it } from 'vitest'
import { INITIAL_FORM, STEPS, hydrateForm, mapFormToProfile, mapFormToWorkspace, stepIndexById, visibleSteps, type OnboardingForm } from './types'
import { LANGUAGE_OPTIONS } from './options'
import { COUNTRIES, countryName, isValidCountryCode } from './countries'

function form(overrides: Partial<OnboardingForm> = {}): OnboardingForm {
  return { ...INITIAL_FORM, ...overrides }
}

describe('supported languages', () => {
  it('offers exactly the four Recall languages, including Albanian', () => {
    expect(LANGUAGE_OPTIONS.map((o) => o.value).sort()).toEqual(['de', 'en', 'fr', 'sq'])
    expect(LANGUAGE_OPTIONS.find((o) => o.value === 'sq')?.label).toBe('Shqip')
  })
})

describe('country list', () => {
  it('is a complete list including Albania and searchable extremes', () => {
    expect(COUNTRIES.length).toBeGreaterThan(200)
    expect(isValidCountryCode('AL')).toBe(true)
    expect(countryName('AL')).toBe('Albania')
    expect(isValidCountryCode('US')).toBe(true)
    expect(isValidCountryCode('ZZ')).toBe(false)
  })
})

describe('steps', () => {
  it('starts with the account step and ends with review', () => {
    expect(STEPS[0].id).toBe('account')
    expect(STEPS[STEPS.length - 1].id).toBe('review')
    expect(stepIndexById('workspace', STEPS)).toBe(5)
  })

  it('visibleSteps drops the workspace step for Recall Pro but keeps it for Teams', () => {
    expect(visibleSteps('pro').map((s) => s.id)).not.toContain('workspace')
    expect(visibleSteps('teams').map((s) => s.id)).toContain('workspace')
    expect(visibleSteps('pro').length).toBe(STEPS.length - 1)
    expect(visibleSteps('teams').length).toBe(STEPS.length)
  })
})

describe('mapFormToProfile', () => {
  it('stores a stable locale code + native label and normalizes derived fields', () => {
    const p = mapFormToProfile(form({ language: 'sq', timeFormat: '12h', useCases: ['sales-calls', 'other'], customUseCase: 'Board prep', twoFactorStatus: 'skipped' }))
    expect(p.preferred_language).toBe('sq')
    expect(p.language_label).toBe('Shqip')
    expect(p.time_format).toBe('12h')
    expect(p.use_cases).toEqual(['sales-calls', 'other'])
    expect(p.custom_use_case).toBe('Board prep')
    expect(p.two_factor_status).toBe('skipped')
  })

  it('drops the custom use case when "other" is not selected', () => {
    expect(mapFormToProfile(form({ useCases: ['sales-calls'], customUseCase: 'ignored' })).custom_use_case).toBeNull()
  })
})

describe('mapFormToWorkspace', () => {
  it('keeps a custom industry only when industry is "other"', () => {
    expect(mapFormToWorkspace(form({ industry: 'other', customIndustry: 'Winemaking' })).custom_industry).toBe('Winemaking')
    expect(mapFormToWorkspace(form({ industry: 'finance', customIndustry: 'ignored' })).custom_industry).toBeNull()
  })
})

describe('hydrateForm (resume)', () => {
  it('restores saved answers and never loses them under detected defaults', () => {
    const hydrated = hydrateForm(INITIAL_FORM, {
      user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@acme.com' },
      profile: {
        uid: 'u1',
        preferred_language: 'sq',
        country_code: 'AL',
        use_cases: ['recruiting'],
        onboarding_step: 4,
      } as never,
      workspace: { name: 'Analytical Engine', type: 'startup', team_size: '2-5', industry: 'software' },
    })
    expect(hydrated.language).toBe('sq')
    expect(hydrated.country).toBe('AL')
    expect(hydrated.useCases).toEqual(['recruiting'])
    expect(hydrated.workspaceName).toBe('Analytical Engine')
    expect(hydrated.workspaceType).toBe('startup')
    expect(hydrated.fullName).toBe('Ada Lovelace')
  })

  it('defaults an unnamed workspace to the user first name', () => {
    const hydrated = hydrateForm(INITIAL_FORM, {
      user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@acme.com' },
      profile: null,
      workspace: null,
    })
    expect(hydrated.workspaceName).toBe("Ada's Workspace")
  })
})
