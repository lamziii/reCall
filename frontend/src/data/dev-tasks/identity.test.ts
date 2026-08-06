import { afterEach, describe, expect, it } from 'vitest'
import { clearIdentity, getIdentity, setIdentity } from './identity'

describe('dev task board identity (localStorage attribution)', () => {
  afterEach(() => {
    clearIdentity()
  })

  it('is null before any selection', () => {
    expect(getIdentity()).toBeNull()
  })

  it('persists Uvejs and reads it back', () => {
    setIdentity('uvejs')
    expect(getIdentity()).toBe('uvejs')
  })

  it('persists Lorik and reads it back', () => {
    setIdentity('lorik')
    expect(getIdentity()).toBe('lorik')
  })

  it('survives a simulated refresh (value stays in storage)', () => {
    setIdentity('lorik')
    // getIdentity reads fresh from localStorage each call — simulates a reload.
    expect(getIdentity()).toBe('lorik')
    expect(window.localStorage.getItem('recall_taskboard_user')).toBe('lorik')
  })

  it('switching overwrites the previous identity', () => {
    setIdentity('uvejs')
    setIdentity('lorik')
    expect(getIdentity()).toBe('lorik')
  })

  it('ignores an unknown stored value', () => {
    window.localStorage.setItem('recall_taskboard_user', 'someone-else')
    expect(getIdentity()).toBeNull()
  })

  it('clears the identity', () => {
    setIdentity('uvejs')
    clearIdentity()
    expect(getIdentity()).toBeNull()
  })
})
