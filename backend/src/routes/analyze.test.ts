import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import request from 'supertest'
import { createApp } from '../app.ts'

const app = createApp()

describe('POST /api/v1/analyze', () => {
  it('rejects requests with no files using the standard error envelope', async () => {
    const response = await request(app)
      .post('/api/v1/analyze')
      .field('instruction', 'Compare the information across all uploaded documents.')

    assert.equal(response.status, 400)
    assert.equal(response.body.data, null)
    assert.equal(response.body.error.code, 'VALIDATION_ERROR')
    assert.ok(response.body.meta.requestId)
  })

  it('rejects a too-short analysis instruction', async () => {
    const response = await request(app)
      .post('/api/v1/analyze')
      .field('instruction', 'compare')
      .attach('files', Buffer.from('Company name: Aurora Holdings Pty Ltd'), 'aurora.txt')

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, 'VALIDATION_ERROR')
  })
})
