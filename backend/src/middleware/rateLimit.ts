import type { NextFunction, Request, Response } from 'express'
import { ERROR_CODES } from '../../../shared/types.ts'
import { AppError } from '../util/errors.ts'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ANALYZE = 20
const hits = new Map<string, number[]>()

export function analyzeRateLimit(req: Request, _res: Response, next: NextFunction): void {
  limit(req, next, MAX_ANALYZE, 'Too many analysis requests. Please wait and try again.')
}

export function loginRateLimit(req: Request, _res: Response, next: NextFunction): void {
  limit(req, next, 8, 'Too many sign-in attempts. Please wait and try again.')
}

function limit(req: Request, next: NextFunction, max: number, message: string): void {
  const key = `${req.path}:${req.ip ?? 'unknown'}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= max) {
    next(new AppError(ERROR_CODES.RATE_LIMITED, message, 429))
    return
  }
  recent.push(now)
  hits.set(key, recent)
  next()
}
