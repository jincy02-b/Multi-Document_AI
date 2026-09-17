export const DOCUMENT_STATUSES = [
  'processed',
  'unsupported',
  'unreadable',
  'empty',
  'invalid',
  'failed',
] as const

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const FINDING_KINDS = ['fact', 'interpretation'] as const
export type FindingKind = (typeof FINDING_KINDS)[number]

export interface ApiErrorBody {
  code: string
  message: string
}

export interface ApiMeta {
  requestId: string
}

export interface ApiEnvelope<T> {
  data: T | null
  error: ApiErrorBody | null
  meta: ApiMeta
}

export interface DocumentStatusView {
  documentId: string
  filename: string
  status: DocumentStatus
  error?: string
  truncated?: boolean
}

export interface Provenance {
  documentId: string
  filename: string
  locator?: string
}

export interface KeyValueFinding {
  key: string
  value: string
  kind: FindingKind
  source: Provenance
}

export interface ComparisonCell {
  documentId: string
  filename: string
  value: string
}

export interface ComparisonRow {
  field: string
  values: ComparisonCell[]
}

export interface Discrepancy {
  field: string
  description: string
  values: ComparisonCell[]
}

export interface MissingInformation {
  field: string
  note: string
  source: Provenance
}

export interface IndependentDocumentAnalysis {
  documentId: string
  filename: string
  status: DocumentStatus
  facts: KeyValueFinding[]
  notes: string[]
}

export interface AnalyzeResult {
  analysisId: string
  instruction: string
  summary: string
  comparisonTable: ComparisonRow[]
  discrepancies: Discrepancy[]
  missingInformation: MissingInformation[]
  keyValues: KeyValueFinding[]
  independentAnalyses: IndependentDocumentAnalysis[]
  documents: DocumentStatusView[]
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_OUTPUT_INVALID: 'AI_OUTPUT_INVALID',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const
