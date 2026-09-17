import { createHmac } from 'node:crypto'
import type { Request, Response } from 'express'
import { config } from '../config.ts'
import { safeEqual } from './session.ts'

export function signCookieValue(value: string): string {
  const sig = createHmac('sha256', config.auth.sessionSecret).update(value).digest('hex')
  return `${value}.${sig}`
}

export function unsignCookieValue(signed: string | undefined): string | undefined {
  if (!signed) return undefined
  const idx = signed.lastIndexOf('.')
  if (idx <= 0) return undefined
  const value = signed.slice(0, idx)
  const sig = signed.slice(idx + 1)
  const expected = createHmac('sha256', config.auth.sessionSecret).update(value).digest('hex')
  if (!safeEqual(sig, expected)) return undefined
  return value
}

export function readCookies(req: Request): Record<string, string> {
  const header = req.header('cookie')
  if (!header) return {}
  const cookies: Record<string, string> = {}
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    cookies[key] = decodeURIComponent(value)
  }
  return cookies
}

export function readSessionId(req: Request): string | undefined {
  return unsignCookieValue(readCookies(req)[config.auth.cookieName])
}

export function setSessionCookie(res: Response, sessionId: string): void {
  res.append('Set-Cookie', serializeCookie(signCookieValue(sessionId), config.auth.sessionTtlMs, false))
}

export function clearSessionCookie(res: Response): void {
  res.append('Set-Cookie', serializeCookie('', 0, true))
}

function serializeCookie(value: string, maxAgeMs: number, expired: boolean): string {
  const parts = [
    `${config.auth.cookieName}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${expired ? 0 : Math.floor(maxAgeMs / 1000)}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (config.nodeEnv === 'production') parts.push('Secure')
  return parts.join('; ')
}
