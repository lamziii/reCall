import { describe, expect, it } from 'vitest'
import {
  assessPassword,
  isValidEmail,
  normalizeEmail,
  validateAccountStep,
  validateInviteEmail,
} from './validation'

describe('email validation', () => {
  it('accepts well-formed emails and rejects malformed ones', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
    expect(isValidEmail('  person@company.co  ')).toBe(true)
    expect(isValidEmail('nope')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('normalizes to trimmed lowercase', () => {
    expect(normalizeEmail('  Person@Company.COM ')).toBe('person@company.com')
  })
})

describe('password strength', () => {
  it('requires at least 6 characters to be acceptable', () => {
    expect(assessPassword('abc').acceptable).toBe(false)
    expect(assessPassword('abcdef').acceptable).toBe(true)
  })

  it('rates a long mixed password as strong', () => {
    expect(assessPassword('Str0ng!Pass').strength).toBe('strong')
    expect(assessPassword('abcdef').strength).toBe('weak')
  })
})

describe('validateAccountStep', () => {
  const base = { name: 'Ada', email: 'ada@example.com', password: 'secret1', confirmPassword: 'secret1', consent: true }

  it('passes a complete valid form', () => {
    expect(validateAccountStep(base)).toEqual({})
  })

  it('flags a password mismatch', () => {
    expect(validateAccountStep({ ...base, confirmPassword: 'different' }).confirmPassword).toBeTruthy()
  })

  it('requires consent', () => {
    expect(validateAccountStep({ ...base, consent: false }).consent).toBeTruthy()
  })

  it('flags a weak password and missing name/email', () => {
    const errors = validateAccountStep({ name: '', email: 'bad', password: '123', confirmPassword: '123', consent: true })
    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.password).toBeTruthy()
  })
})

describe('validateInviteEmail', () => {
  const ctx = { currentUserEmail: 'owner@acme.com', pendingEmails: ['taken@acme.com'] }

  it('accepts a fresh valid email', () => {
    expect(validateInviteEmail('new@acme.com', ctx)).toBe('ok')
  })

  it('rejects an invalid email', () => {
    expect(validateInviteEmail('nope', ctx)).toBe('invalid')
  })

  it('rejects inviting yourself (case-insensitive)', () => {
    expect(validateInviteEmail('OWNER@acme.com', ctx)).toBe('self')
  })

  it('rejects a duplicate pending invite', () => {
    expect(validateInviteEmail('taken@acme.com', ctx)).toBe('duplicate')
  })

  it('rejects existing members and already-invited emails', () => {
    expect(validateInviteEmail('bob@acme.com', { ...ctx, memberEmails: ['bob@acme.com'] })).toBe('already-member')
    expect(validateInviteEmail('carol@acme.com', { ...ctx, existingInviteEmails: ['carol@acme.com'] })).toBe('already-invited')
  })
})
