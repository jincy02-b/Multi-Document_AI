import cors from 'cors'
import express from 'express'
import { config } from './config.ts'
import { apiRouter } from './routes/api.ts'
import { errorHandler, requestIdMiddleware } from './middleware/errorHandler.ts'
import { AppError } from './util/errors.ts'
import { ERROR_CODES } from '../../shared/types.ts'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '32kb' }))
  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: false,
      allowedHeaders: ['Content-Type', 'x-user-id', 'x-request-id'],
    }),
  )
  app.use(requestIdMiddleware)
  app.use((req, _res, next) => {
    const header = req.header('x-user-id')?.trim()
    req.userId = header && /^[a-zA-Z0-9_-]{3,64}$/.test(header) ? header : 'demo-user'
    next()
  })
  app.use('/api/v1', apiRouter)
  app.use((_req, _res, next) => {
    next(new AppError(ERROR_CODES.VALIDATION_ERROR, 'Not found', 404))
  })
  app.use(errorHandler)
  return app
}
