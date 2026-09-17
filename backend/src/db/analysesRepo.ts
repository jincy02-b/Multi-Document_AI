import type { ResultSetHeader } from 'mysql2'
import type { AnalyzeResult, DocumentStatusView } from '../../../shared/types.ts'
import { withTransaction } from './pool.ts'

export interface DocumentInsert {
  id: string
  originalFilename: string
  storedName: string
  extension: string
  mimeType: string
  byteSize: number
  status: DocumentStatusView['status']
  errorMessage?: string
  truncated: boolean
  extractedCharCount: number
}

export async function persistAnalysis(input: {
  analysisId: string
  userId: string
  instruction: string
  result: AnalyzeResult
  documents: DocumentInsert[]
}): Promise<void> {
  await withTransaction(async (conn) => {
    await conn.query<ResultSetHeader>(
      `INSERT INTO analyses (id, user_id, instruction, result_json)
       VALUES (?, ?, ?, ?)`,
      [input.analysisId, input.userId, input.instruction, JSON.stringify(input.result)],
    )

    for (const doc of input.documents) {
      await conn.query<ResultSetHeader>(
        `INSERT INTO documents (
           id, analysis_id, user_id, original_filename, stored_name, extension,
           mime_type, byte_size, status, error_message, truncated, extracted_char_count
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          doc.id,
          input.analysisId,
          input.userId,
          doc.originalFilename,
          doc.storedName,
          doc.extension,
          doc.mimeType,
          doc.byteSize,
          doc.status,
          doc.errorMessage ?? null,
          doc.truncated ? 1 : 0,
          doc.extractedCharCount,
        ],
      )
    }
  })
}

export async function getAnalysisForUser(
  analysisId: string,
  userId: string,
): Promise<AnalyzeResult | null> {
  const { getPool } = await import('./pool.ts')
  const [rows] = await getPool().query(
    'SELECT result_json FROM analyses WHERE id = ? AND user_id = ? LIMIT 1',
    [analysisId, userId],
  )
  const record = Array.isArray(rows) ? (rows[0] as { result_json: AnalyzeResult | string } | undefined) : undefined
  if (!record) return null
  return typeof record.result_json === 'string' ? JSON.parse(record.result_json) : record.result_json
}
