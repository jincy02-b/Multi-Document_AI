import type { Extractor } from './types.ts'
import { looksBinary } from '../validation/files.ts'
import { AppError } from '../util/errors.ts'

export const txtExtractor: Extractor = {
  ext: '.txt',
  async extract(buffer) {
    if (looksBinary(buffer)) {
      throw new AppError('UNREADABLE_TXT', 'The text document appears to be binary or corrupted', 400)
    }
    return buffer.toString('utf8').replace(/^\uFEFF/, '').replace(/\r/g, '').trim()
  },
}
