import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'
import { ERROR_CODES, type ApiEnvelope } from '../../../shared/types.ts'
import { AppError } from '../util/errors.ts'

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id') || randomUUID()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)
  next()
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId ?? 'unknown'

  if (err instanceof AppError) {
    const body: ApiEnvelope<null> = {
      data: null,
      error: { code: err.code, message: err.message },
      meta: { requestId },
    }
    res.status(err.status).json(body)
    return
  }

  if (err instanceof ZodError) {
    const body: ApiEnvelope<null> = {
      data: null,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid request' },
      meta: { requestId },
    }
    res.status(400).json(body)
    return
  }

  if (err instanceof SyntaxError) {
    const body: ApiEnvelope<null> = {
      data: null,
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid request' },
      meta: { requestId },
    }
    res.status(400).json(body)
    return
  }

  console.error('Unhandled error', { requestId, err })
  const body: ApiEnvelope<null> = {
    data: null,
    error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'An unexpected error occurred' },
    meta: { requestId },
  }
  res.status(500).json(body)
}
