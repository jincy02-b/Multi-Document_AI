import type { NextFunction, Request, Response } from 'express'
import { destroySession, getSession } from '../auth/session.ts'
import { clearSessionCookie, readSessionId } from '../auth/cookies.ts'
import { AppError } from '../util/errors.ts'
import { ERROR_CODES } from '../../../shared/types.ts'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionId = readSessionId(req)
  const session = getSession(sessionId)
  if (!session) {
    if (sessionId) {
      destroySession(sessionId)
      clearSessionCookie(res)
    }
    next(new AppError(ERROR_CODES.UNAUTHORIZED, 'Please sign in', 401))
    return
  }
  req.userId = session.username
  next()
}
