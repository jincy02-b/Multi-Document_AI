import { Router } from 'express'
import { parseLoginBody } from '../validation/login.ts'
import { createSession, credentialsMatch, destroySession } from '../auth/session.ts'
import { clearSessionCookie, readSessionId, setSessionCookie } from '../auth/cookies.ts'
import { loginRateLimit } from '../middleware/rateLimit.ts'
import { requireAuth } from '../middleware/requireAuth.ts'
import { AppError } from '../util/errors.ts'
import { ERROR_CODES, type ApiEnvelope } from '../../../shared/types.ts'

export const authRouter = Router()

authRouter.post('/login', loginRateLimit, (req, res, next) => {
  try {
    const { username, password } = parseLoginBody(req.body)
    if (!credentialsMatch(username, password)) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Invalid username or password', 401)
    }
    destroySession(readSessionId(req))
    const sessionId = createSession(username)
    setSessionCookie(res, sessionId)
    res.setHeader('Cache-Control', 'no-store')
    const body: ApiEnvelope<{ username: string }> = {
      data: { username },
      error: null,
      meta: { requestId: req.requestId ?? '' },
    }
    res.json(body)
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', (req, res) => {
  destroySession(readSessionId(req))
  clearSessionCookie(res)
  res.setHeader('Cache-Control', 'no-store')
  const body: ApiEnvelope<{ signedOut: true }> = {
    data: { signedOut: true },
    error: null,
    meta: { requestId: req.requestId ?? '' },
  }
  res.json(body)
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const body: ApiEnvelope<{ username: string }> = {
    data: { username: req.userId ?? '' },
    error: null,
    meta: { requestId: req.requestId ?? '' },
  }
  res.json(body)
})
