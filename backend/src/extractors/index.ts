import { randomUUID } from 'node:crypto'
import { config } from '../config.ts'
import { ALLOWED_EXTENSIONS, extensionOf, isAllowedMime } from '../validation/files.ts'
import type { ExtractedDocument } from './types.ts'
import { csvExtractor } from './csvExtractor.ts'
import { pdfExtractor } from './pdfExtractor.ts'
import { txtExtractor } from './txtExtractor.ts'
import { AppError } from '../util/errors.ts'

const extractors = {
  '.pdf': pdfExtractor,
  '.csv': csvExtractor,
  '.txt': txtExtractor,
} as const

export interface UploadedFile {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

export async function processUploadedFiles(files: UploadedFile[]): Promise<ExtractedDocument[]> {
  const results: ExtractedDocument[] = []
  for (const file of files) {
    results.push(await processOne(file))
  }
  return results
}

async function processOne(file: UploadedFile): Promise<ExtractedDocument> {
  const id = randomUUID()
  const storedName = randomUUID()
  const filename = (file.originalname.split(/[/\\]/).pop() || 'document').slice(0, 180)
  const extension = extensionOf(filename)
  const base: Omit<ExtractedDocument, 'status' | 'error' | 'text' | 'truncated' | 'extractedCharCount'> = {
    id,
    filename,
    storedName,
    extension,
    mimeType: file.mimetype || 'application/octet-stream',
    byteSize: file.size,
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return done(base, { status: 'unsupported', error: 'Unsupported file format. Allowed: PDF, CSV, TXT.' })
  }
  if (file.size <= 0) {
    return done(base, { status: 'empty', error: 'The file is empty.' })
  }
  if (file.size > config.upload.maxFileBytes) {
    return done(base, { status: 'invalid', error: 'The file exceeds the 2 MB size limit.' })
  }
  if (!isAllowedMime(extension, file.mimetype || '')) {
    return done(base, { status: 'invalid', error: 'File extension and MIME type do not match the allowlist.' })
  }

  try {
    const extractor = extractors[extension as keyof typeof extractors]
    const extracted = await extractor.extract(file.buffer)
    if (!extracted) {
      return done(base, { status: 'empty', error: 'No readable content was found in the document.' })
    }
    const truncated = extracted.length > config.contentLimitChars
    const text = truncated ? extracted.slice(0, config.contentLimitChars) : extracted
    return {
      ...base,
      status: 'processed',
      text,
      truncated,
      extractedCharCount: text.length,
    }
  } catch (error) {
    const message = error instanceof AppError ? error.message : 'The document could not be processed.'
    return done(base, { status: 'unreadable', error: message })
  }
}

function done(
  base: Omit<ExtractedDocument, 'status' | 'error' | 'text' | 'truncated' | 'extractedCharCount'>,
  extra: { status: ExtractedDocument['status']; error: string },
): ExtractedDocument {
  return {
    ...base,
    status: extra.status,
    error: extra.error,
    text: '',
    truncated: false,
    extractedCharCount: 0,
  }
}
