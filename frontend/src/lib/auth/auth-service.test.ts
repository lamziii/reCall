import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './auth-service'

describe('authErrorMessage (sign-up / sign-in error mapping)', () => {
  it('maps the common Firebase auth error codes to user-safe messages', () => {
    expect(authErrorMessage({ code: 'auth/email-already-in-use' }, 'fallback')).toMatch(/already exists/i)
    expect(authErrorMessage({ code: 'auth/invalid-email' }, 'fallback')).toMatch(/valid email/i)
    expect(authErrorMessage({ code: 'auth/weak-password' }, 'fallback')).toMatch(/stronger password/i)
    expect(authErrorMessage({ code: 'auth/network-request-failed' }, 'fallback')).toMatch(/connection/i)
  })

  it('treats wrong-password and invalid-credential as an incorrect sign-in', () => {
    expect(authErrorMessage({ code: 'auth/wrong-password' }, 'fallback')).toMatch(/incorrect/i)
    expect(authErrorMessage({ code: 'auth/invalid-credential' }, 'fallback')).toMatch(/incorrect/i)
  })

  it('returns the provided fallback for unknown/absent codes', () => {
    expect(authErrorMessage({ code: 'auth/unknown' }, 'my fallback')).toBe('my fallback')
    expect(authErrorMessage(new Error('boom'), 'my fallback')).toBe('my fallback')
  })
})
