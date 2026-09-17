import { randomBytes, timingSafeEqual } from 'node:crypto'
import { config } from '../config.ts'

interface Session {
  username: string
  expiresAt: number
}

const sessions = new Map<string, Session>()

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) {
    timingSafeEqual(a, Buffer.alloc(a.length))
    return false
  }
  return timingSafeEqual(a, b)
}

export function credentialsMatch(username: string, password: string): boolean {
  const userOk = safeEqual(username, config.auth.username)
  const passOk = safeEqual(password, config.auth.password)
  return userOk && passOk
}

export function createSession(username: string): string {
  const id = randomBytes(32).toString('hex')
  sessions.set(id, { username, expiresAt: Date.now() + config.auth.sessionTtlMs })
  return id
}

export function getSession(id: string | undefined): Session | null {
  if (!id) return null
  const session = sessions.get(id)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    sessions.delete(id)
    return null
  }
  return session
}

export function destroySession(id: string | undefined): void {
  if (id) sessions.delete(id)
}
