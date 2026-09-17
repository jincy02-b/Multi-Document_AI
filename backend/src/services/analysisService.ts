import { randomUUID } from 'node:crypto'
import type { AnalyzeResult, DocumentStatusView, IndependentDocumentAnalysis } from '../../../shared/types.ts'
import { persistAnalysis } from '../db/analysesRepo.ts'
import { processUploadedFiles, type UploadedFile } from '../extractors/index.ts'
import { runAnalysis } from '../ai/index.ts'
import { toProviderDocuments } from '../ai/types.ts'
import { AppError } from '../util/errors.ts'
import { ERROR_CODES } from '../../../shared/types.ts'

export async function analyzeDocuments(input: {
  userId: string
  instruction: string
  files: UploadedFile[]
}): Promise<AnalyzeResult> {
  const processed = await processUploadedFiles(input.files)
  const providerDocs = toProviderDocuments(processed)

  let ai
  try {
    ai = providerDocs.length > 0 ? await runAnalysis({ instruction: input.instruction, documents: providerDocs }) : emptyAi()
  } catch (error) {
    if (error instanceof AppError && error.code === ERROR_CODES.AI_UNAVAILABLE) {
      ai = emptyAi('AI analysis could not be completed. Extracted document statuses are still returned.')
    } else {
      throw error
    }
  }

  const documents: DocumentStatusView[] = processed.map((doc) => ({
    documentId: doc.id,
    filename: doc.filename,
    status: doc.status,
    error: doc.error,
    truncated: doc.truncated,
  }))

  const independentAnalyses: IndependentDocumentAnalysis[] = processed.map((doc) => {
    const fromAi = ai.independentAnalyses.find((item) => item.documentId === doc.id)
    return {
      documentId: doc.id,
      filename: doc.filename,
      status: doc.status,
      facts: (fromAi?.facts ?? []).map((fact) => ({
        key: fact.key,
        value: fact.value,
        kind: 'fact' as const,
        source: { documentId: doc.id, filename: doc.filename, locator: fact.locator },
      })),
      notes: [
        ...(fromAi?.notes ?? []),
        ...(doc.error ? [doc.error] : []),
      ],
    }
  })

  const analysisId = randomUUID()
  const result: AnalyzeResult = {
    analysisId,
    instruction: input.instruction,
    summary: ai.summary,
    comparisonTable: ai.comparisonTable,
    discrepancies: ai.discrepancies,
    missingInformation: ai.missingInformation,
    keyValues: ai.keyValues,
    independentAnalyses,
    documents,
  }

  await persistAnalysis({
    analysisId,
    userId: input.userId,
    instruction: input.instruction,
    result,
    documents: processed.map((doc) => ({
      id: doc.id,
      originalFilename: doc.filename,
      storedName: doc.storedName,
      extension: doc.extension || 'none',
      mimeType: doc.mimeType,
      byteSize: doc.byteSize,
      status: doc.status,
      errorMessage: doc.error,
      truncated: doc.truncated,
      extractedCharCount: doc.extractedCharCount,
    })),
  })

  return result
}

function emptyAi(summary?: string) {
  return {
    summary:
      summary ??
      'No documents could be processed, so independent and collective analysis were not run. See document statuses for details.',
    comparisonTable: [],
    discrepancies: [],
    missingInformation: [],
    keyValues: [],
    independentAnalyses: [],
  }
}
