import cors from 'cors'
import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import { config } from './config.ts'
import { apiRouter } from './routes/api.ts'
import { errorHandler, requestIdMiddleware } from './middleware/errorHandler.ts'
import { AppError } from './util/errors.ts'
import { ERROR_CODES } from '../../shared/types.ts'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-DNS-Prefetch-Control', 'off')
    next()
  })
  app.use(express.json({ limit: '8kb' }))
  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: true,
      allowedHeaders: ['Content-Type', 'x-request-id'],
    }),
  )
  app.use(requestIdMiddleware)
  app.use('/api/v1', apiRouter)
  app.use((_req, _res, next) => {
    next(new AppError(ERROR_CODES.VALIDATION_ERROR, 'Not found', 404))
  })
  app.use(errorHandler)
  return app
}
