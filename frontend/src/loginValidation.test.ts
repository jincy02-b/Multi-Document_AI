import { describe, expect, it } from 'vitest'
import { validateLogin } from './loginValidation'

describe('validateLogin', () => {
  it('rejects short or unsafe credentials before they are sent', () => {
    expect(validateLogin('ab', 'ChangeMe!2026')).toBe('Enter a valid username.')
    expect(validateLogin('analyst', 'short')).toBe('Enter a valid password.')
    expect(validateLogin('bad user', 'ChangeMe!2026')).toContain('Username may contain')
  })

  it('accepts the env-style demo username and password format', () => {
    expect(validateLogin('analyst', 'ChangeMe!2026')).toBeNull()
  })
})
