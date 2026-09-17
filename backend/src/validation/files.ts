import { z } from 'zod'
import { AppError } from '../util/errors.ts'
import { ERROR_CODES } from '../../../shared/types.ts'

export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.csv', '.txt'])

const MIME_BY_EXT: Record<string, string[]> = {
  '.pdf': ['application/pdf', 'application/octet-stream'],
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain', 'application/octet-stream'],
  '.txt': ['text/plain', 'text/csv', 'application/octet-stream'],
}

export const AnalyzeInstructionSchema = z
  .string()
  .trim()
  .min(8, 'Analysis instruction must be at least 8 characters')
  .max(2000, 'Analysis instruction must be at most 2000 characters')

export function sanitizeInstruction(raw: unknown): string {
  const parsed = AnalyzeInstructionSchema.safeParse(raw)
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? 'Invalid instruction', 400)
  }
  return parsed.data.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

export function extensionOf(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename
  const idx = base.lastIndexOf('.')
  return idx >= 0 ? base.slice(idx).toLowerCase() : ''
}

export function isAllowedMime(ext: string, mime: string): boolean {
  const allowed = MIME_BY_EXT[ext]
  if (!allowed) return false
  return allowed.includes(mime.toLowerCase())
}

export function looksBinary(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 800))
  let suspicious = 0
  for (const byte of sample) {
    if (byte === 0) return true
    if (byte < 7 || (byte > 13 && byte < 32)) suspicious += 1
  }
  return suspicious / sample.length > 0.3
}
