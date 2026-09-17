import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import request from 'supertest'
import { createApp } from '../app.ts'
import { config } from '../config.ts'

const app = createApp()

describe('auth', () => {
  it('rejects malformed login bodies without revealing which field failed', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ username: 'a', password: 'short' })
    assert.equal(response.status, 400)
    assert.equal(response.body.error.code, 'VALIDATION_ERROR')
    assert.equal(response.body.data, null)
  })

  it('rejects unknown extra fields', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: config.auth.username, password: config.auth.password, role: 'admin' })
    assert.equal(response.status, 400)
  })

  it('rejects invalid credentials with a generic message', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: config.auth.username, password: 'WrongPass!2026' })
    assert.equal(response.status, 401)
    assert.equal(response.body.error.code, 'UNAUTHORIZED')
    assert.equal(response.body.error.message, 'Invalid username or password')
    assert.equal(typeof response.headers['set-cookie'], 'undefined')
  })

  it('sets an httpOnly session cookie on success and supports logout', async () => {
    const agent = request.agent(app)
    const login = await agent.post('/api/v1/auth/login').send({
      username: config.auth.username,
      password: config.auth.password,
    })
    assert.equal(login.status, 200)
    assert.equal(login.body.data.username, config.auth.username)
    assert.match(String(login.headers['set-cookie']), /HttpOnly/i)
    assert.doesNotMatch(JSON.stringify(login.body), new RegExp(config.auth.password))

    const me = await agent.get('/api/v1/auth/me')
    assert.equal(me.status, 200)
    assert.equal(me.body.data.username, config.auth.username)

    const logout = await agent.post('/api/v1/auth/logout')
    assert.equal(logout.status, 200)

    const after = await agent.get('/api/v1/auth/me')
    assert.equal(after.status, 401)
  })
})
