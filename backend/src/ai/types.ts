import type { ExtractedDocument } from '../extractors/types.ts'

export interface ProviderDocument {
  id: string
  filename: string
  text: string
  truncated: boolean
}

export interface ProviderAnalyzeInput {
  instruction: string
  documents: ProviderDocument[]
}

export interface ProviderAnalyzeOutput {
  summary: string
  comparisonTable: {
    field: string
    values: { documentId: string; filename: string; value: string }[]
  }[]
  discrepancies: {
    field: string
    description: string
    values: { documentId: string; filename: string; value: string }[]
  }[]
  missingInformation: {
    field: string
    note: string
    source: { documentId: string; filename: string; locator?: string }
  }[]
  keyValues: {
    key: string
    value: string
    kind: 'fact' | 'interpretation'
    source: { documentId: string; filename: string; locator?: string }
  }[]
  independentAnalyses: {
    documentId: string
    filename: string
    facts: { key: string; value: string; locator?: string }[]
    notes: string[]
  }[]
}

export interface AnalysisProvider {
  analyze(input: ProviderAnalyzeInput): Promise<ProviderAnalyzeOutput>
}

export function toProviderDocuments(docs: ExtractedDocument[]): ProviderDocument[] {
  return docs
    .filter((d) => d.status === 'processed')
    .map((d) => ({ id: d.id, filename: d.filename, text: d.text, truncated: d.truncated }))
}
