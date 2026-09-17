import type { AnalyzeResult, ApiEnvelope } from '@shared/types'

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Cannot reach the API. In the backend folder run npm run dev and wait for “API listening on http://127.0.0.1:3001”.',
    )
  }
  return (await response.json()) as ApiEnvelope<T>
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, { credentials: 'include', ...init })
  } catch {
    throw new Error(
      'Cannot reach the API. In the backend folder run npm run dev and wait for “API listening on http://127.0.0.1:3001”.',
    )
  }
}

export async function login(username: string, password: string): Promise<{ username: string }> {
  const response = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const payload = await parseEnvelope<{ username: string }>(response)
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? 'Sign-in failed')
  }
  return payload.data
}

export async function logout(): Promise<void> {
  await apiFetch('/api/v1/auth/logout', { method: 'POST' })
}

export async function currentUser(): Promise<string | null> {
  const response = await apiFetch('/api/v1/auth/me')
  if (response.status === 401) return null
  const payload = await parseEnvelope<{ username: string }>(response)
  return payload.data?.username ?? null
}

export async function analyzeDocuments(files: File[], instruction: string): Promise<AnalyzeResult> {
  const body = new FormData()
  body.set('instruction', instruction)
  for (const file of files) body.append('files', file)

  const response = await apiFetch('/api/v1/analyze', {
    method: 'POST',
    body,
  })

  const payload = await parseEnvelope<AnalyzeResult>(response)
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
