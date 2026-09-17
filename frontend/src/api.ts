import type { AnalyzeResult, ApiEnvelope } from '@shared/types'

const USER_KEY = 'mdiw-user-id'

function userId(): string {
  const existing = localStorage.getItem(USER_KEY)
  if (existing) return existing
  const created = `user-${crypto.randomUUID().slice(0, 8)}`
  localStorage.setItem(USER_KEY, created)
  return created
}

export async function analyzeDocuments(files: File[], instruction: string): Promise<AnalyzeResult> {
  const body = new FormData()
  body.set('instruction', instruction)
  for (const file of files) body.append('files', file)

  const response = await fetch('/api/v1/analyze', {
    method: 'POST',
    headers: { 'x-user-id': userId() },
    body,
  })

  let payload: ApiEnvelope<AnalyzeResult>
  try {
    payload = (await response.json()) as ApiEnvelope<AnalyzeResult>
  } catch {
    throw new Error('Analysis failed')
  }
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? 'Analysis failed')
  }
  return payload.data
}

export function formatCopyText(result: AnalyzeResult): string {
  const lines: string[] = []
  lines.push('MULTI-DOCUMENT INTELLIGENCE WORKBENCH')
  lines.push(`Analysis ID: ${result.analysisId}`)
  lines.push(`Instruction: ${result.instruction}`)
  lines.push('')
  lines.push('DOCUMENT STATUSES')
  for (const doc of result.documents) {
    lines.push(`- ${doc.filename} [${doc.status}]${doc.error ? ` ${doc.error}` : ''}`)
  }
  lines.push('')
  lines.push('INDEPENDENT ANALYSIS')
  for (const doc of result.independentAnalyses) {
    lines.push(`- ${doc.filename} [${doc.status}]`)
    for (const fact of doc.facts) {
      lines.push(`    ${fact.key}: ${fact.value} (${fact.source.locator ?? 'document'})`)
    }
    for (const note of doc.notes) lines.push(`    note: ${note}`)
  }
  lines.push('')
  lines.push('CONSOLIDATED SUMMARY')
  lines.push(result.summary)
  lines.push('')
  lines.push('STRUCTURED COMPARISON')
  for (const row of result.comparisonTable) {
    lines.push(`${row.field}:`)
    for (const cell of row.values) lines.push(`  - ${cell.filename} (${cell.documentId}): ${cell.value}`)
  }
  lines.push('')
  lines.push('DISCREPANCIES')
  if (result.discrepancies.length === 0) lines.push('- None')
  for (const item of result.discrepancies) {
    lines.push(`- ${item.field}: ${item.description}`)
    for (const cell of item.values) lines.push(`    ${cell.filename}: ${cell.value}`)
  }
  lines.push('')
  lines.push('MISSING INFORMATION')
  if (result.missingInformation.length === 0) lines.push('- None')
  for (const item of result.missingInformation) {
    lines.push(`- ${item.field} (${item.source.filename}): ${item.note}`)
  }
  lines.push('')
  lines.push('KEY-VALUE EXTRACTION')
  for (const kv of result.keyValues) {
    lines.push(`- [${kv.kind}] ${kv.key}: ${kv.value} (source: ${kv.source.filename}${kv.source.locator ? `, ${kv.source.locator}` : ''})`)
  }
  return lines.join('\n')
}
