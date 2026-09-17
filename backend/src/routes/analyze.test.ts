import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import request from 'supertest'
import { createApp } from '../app.ts'
import { config } from '../config.ts'

const app = createApp()

describe('POST /api/v1/analyze', () => {
  it('rejects unauthenticated analysis requests', async () => {
    const response = await request(app)
      .post('/api/v1/analyze')
      .field('instruction', 'Compare the information across all uploaded documents.')

    assert.equal(response.status, 401)
    assert.equal(response.body.error.code, 'UNAUTHORIZED')
  })

  it('rejects authenticated requests with no files using the standard error envelope', async () => {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({
      username: config.auth.username,
      password: config.auth.password,
    })

    const response = await agent
      .post('/api/v1/analyze')
      .field('instruction', 'Compare the information across all uploaded documents.')

    assert.equal(response.status, 400)
    assert.equal(response.body.data, null)
    assert.equal(response.body.error.code, 'VALIDATION_ERROR')
    assert.ok(response.body.meta.requestId)
  })

  it('rejects a too-short analysis instruction', async () => {
    const agent = request.agent(app)
    await agent.post('/api/v1/auth/login').send({
      username: config.auth.username,
      password: config.auth.password,
    })

    const response = await agent
      .post('/api/v1/analyze')
      .field('instruction', 'compare')
      .attach('files', Buffer.from('Company name: Aurora Holdings Pty Ltd'), 'aurora.txt')

    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, 'VALIDATION_ERROR')
  })
})
