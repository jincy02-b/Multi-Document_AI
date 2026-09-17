import { createRequire } from 'node:module'
import type { Extractor } from './types.ts'
import { AppError } from '../util/errors.ts'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>

export const pdfExtractor: Extractor = {
  ext: '.pdf',
  async extract(buffer) {
    try {
      const result = await pdfParse(buffer)
      return (result.text ?? '').replace(/\r/g, '').trim()
    } catch {
      throw new AppError('UNREADABLE_PDF', 'The PDF could not be read', 400)
    }
  },
}
