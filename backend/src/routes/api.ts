import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { config } from '../config.ts'
import { analyzeDocuments } from '../services/analysisService.ts'
import { getAnalysisForUser } from '../db/analysesRepo.ts'
import { sanitizeInstruction } from '../validation/files.ts'
import { analyzeRateLimit } from '../middleware/rateLimit.ts'
import { AppError } from '../util/errors.ts'
import { ERROR_CODES, type ApiEnvelope, type AnalyzeResult } from '../../../shared/types.ts'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: config.upload.maxFiles,
    fileSize: config.upload.maxFileBytes,
  },
})

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  const body: ApiEnvelope<{ ok: true; database: string }> = {
    data: { ok: true, database: config.mysql.database },
    error: null,
    meta: { requestId: _req.requestId ?? 'health' },
  }
  res.json(body)
})

apiRouter.post(
  '/analyze',
  analyzeRateLimit,
  upload.array('files', config.upload.maxFiles),
  async (req, res, next) => {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? []
      if (files.length === 0) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Upload at least one document', 400)
      }
      if (files.length > config.upload.maxFiles) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, `A maximum of ${config.upload.maxFiles} files is allowed`, 400)
      }

      const instruction = sanitizeInstruction(req.body?.instruction)
      const userId = req.userId ?? 'demo-user'
      const data = await analyzeDocuments({ userId, instruction, files })
      const body: ApiEnvelope<AnalyzeResult> = {
        data,
        error: null,
        meta: { requestId: req.requestId ?? '' },
      }
      res.json(body)
    } catch (error) {
      next(mapMulterError(error))
    }
  },
)

apiRouter.get('/analyses/:id', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const data = await getAnalysisForUser(id, req.userId ?? 'demo-user')
    if (!data) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Analysis not found', 404)
    }
    const body: ApiEnvelope<AnalyzeResult> = {
      data,
      error: null,
      meta: { requestId: req.requestId ?? '' },
    }
    res.json(body)
  } catch (error) {
    next(error)
  }
})

function mapMulterError(error: unknown): unknown {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new AppError(ERROR_CODES.VALIDATION_ERROR, 'A file exceeds the 2 MB size limit', 400)
    }
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      return new AppError(ERROR_CODES.VALIDATION_ERROR, `A maximum of ${config.upload.maxFiles} files is allowed`, 400)
    }
    return new AppError(ERROR_CODES.VALIDATION_ERROR, 'The upload request is invalid', 400)
  }
  return error
}
