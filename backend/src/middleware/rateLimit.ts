import type { NextFunction, Request, Response } from 'express'
import { ERROR_CODES } from '../../../shared/types.ts'
import { AppError } from '../util/errors.ts'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ANALYZE = 20
const hits = new Map<string, number[]>()

export function analyzeRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const key = req.ip ?? 'unknown'
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_ANALYZE) {
    next(new AppError(ERROR_CODES.RATE_LIMITED, 'Too many analysis requests. Please wait and try again.', 429))
    return
  }
  recent.push(now)
  hits.set(key, recent)
  next()
}
