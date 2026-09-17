import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AppError } from '../util/errors.ts'
import {
  extensionOf,
  isAllowedMime,
  sanitizeInstruction,
} from './files.ts'

describe('upload and instruction validation', () => {
  it('accepts a banking analysis instruction and strips control characters', () => {
    const instruction = sanitizeInstruction('Compare names and revenue.\u0000')
    assert.equal(instruction, 'Compare names and revenue.')
  })

  it('rejects an instruction that is too short', () => {
    assert.throws(() => sanitizeInstruction('short'), (error: unknown) => {
      return error instanceof AppError && error.code === 'VALIDATION_ERROR' && error.status === 400
    })
  })

  it('allowlists extensions and matching MIME types', () => {
    assert.equal(extensionOf('..\\uploads\\aurora_financials.CSV'), '.csv')
    assert.equal(isAllowedMime('.pdf', 'application/pdf'), true)
    assert.equal(isAllowedMime('.pdf', 'text/html'), false)
    assert.equal(isAllowedMime('.exe', 'application/octet-stream'), false)
  })
})
