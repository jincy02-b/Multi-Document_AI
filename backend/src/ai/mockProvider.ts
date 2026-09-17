import type { AnalysisProvider, ProviderAnalyzeInput, ProviderAnalyzeOutput } from './types.ts'

const FIELD_PATTERNS: { key: string; label: string; regex: RegExp }[] = [
  { key: 'company_name', label: 'Company name', regex: /(?:company(?:\s+name)?|entity|trading\s+name)\s*[:\-]\s*(.+)/i },
  { key: 'applicant_name', label: 'Applicant name', regex: /(?:applicant|customer|director|contact)\s*[:\-]\s*(.+)/i },
  { key: 'address', label: 'Address', regex: /(?:registered\s+address|address|principal\s+place)\s*[:\-]\s*(.+)/i },
  { key: 'licence_number', label: 'Licence number', regex: /(?:licence|license|afsl|credit\s+licence)\s*(?:number|no\.?)?\s*[:\-]\s*(.+)/i },
  { key: 'abn', label: 'ABN', regex: /(?:abn)\s*[:\-]\s*([0-9\s]+)/i },
  { key: 'revenue', label: 'Revenue', regex: /(?:annual\s+revenue|revenue|turnover)\s*[:\-]\s*([^\n]+)/i },
  { key: 'profit', label: 'Profit', regex: /(?:net\s+profit|profit)\s*[:\-]\s*([^\n]+)/i },
  { key: 'obligation', label: 'Obligation', regex: /(?:obligation|facility|loan\s+purpose|repayment)\s*[:\-]\s*(.+)/i },
  { key: 'effective_date', label: 'Date', regex: /(?:effective\s+date|application\s+date|as\s+at|date)\s*[:\-]\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[A-Za-z]+\s+\d{4})/i },
  { key: 'reporting_period', label: 'Reporting period', regex: /(?:reporting\s+period|financial\s+year|period)\s*[:\-]\s*(.+)/i },
]

function extractFacts(text: string): { key: string; label: string; value: string; locator: string }[] {
  const facts: { key: string; label: string; value: string; locator: string }[] = []
  const lines = text.split('\n')
  for (const field of FIELD_PATTERNS) {
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? ''
      const match = line.match(field.regex)
      if (match?.[1]) {
        const value = match[1].replace(/\s+\|\s+.*$/, '').trim()
        if (value) {
          facts.push({ key: field.key, label: field.label, value, locator: `line ${i + 1}` })
          break
        }
      }
    }
  }
  return facts
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[,$\s]/g, '').replace(/aud|usd|sgd/gi, '')
}

function looksInjected(instruction: string): boolean {
  return /ignore (previous|all) instructions|reveal (system|api) (prompt|key)|disregard policy/i.test(instruction)
}

export const mockAnalysisProvider: AnalysisProvider = {
  async analyze(input: ProviderAnalyzeInput): Promise<ProviderAnalyzeOutput> {
    const independent = input.documents.map((doc) => {
      const facts = extractFacts(doc.text)
      const notes: string[] = []
      if (doc.truncated) notes.push('Content was truncated before analysis because it exceeded the size limit.')
      if (facts.length === 0) notes.push('No labelled banking fields could be extracted from this document.')
      return { documentId: doc.id, filename: doc.filename, facts, notes }
    })

    const fieldKeys = [...new Set(independent.flatMap((d) => d.facts.map((f) => f.key)))]
    const comparisonTable = fieldKeys.map((key) => {
      const label = FIELD_PATTERNS.find((f) => f.key === key)?.label ?? key
      return {
        field: label,
        values: independent.map((doc) => {
          const fact = doc.facts.find((f) => f.key === key)
          return {
            documentId: doc.documentId,
            filename: doc.filename,
            value: fact?.value ?? '—',
          }
        }),
      }
    })

    const discrepancies = comparisonTable
      .map((row) => {
        const present = row.values.filter((v) => v.value !== '—')
        const unique = new Set(present.map((v) => normalize(v.value)))
        if (present.length >= 2 && unique.size >= 2) {
          return {
            field: row.field,
            description: `Extracted values for ${row.field} are not consistent across documents.`,
            values: present,
          }
        }
        return null
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    const missingInformation = independent.flatMap((doc) => {
      const missingKeys = fieldKeys.filter((key) => !doc.facts.some((f) => f.key === key))
      return missingKeys.map((key) => ({
        field: FIELD_PATTERNS.find((f) => f.key === key)?.label ?? key,
        note: 'This field was present in another uploaded document but could not be read here.',
        source: { documentId: doc.documentId, filename: doc.filename },
      }))
    })

    const keyValues = independent.flatMap((doc) =>
      doc.facts.map((fact) => ({
        key: fact.label,
        value: fact.value,
        kind: 'fact' as const,
        source: { documentId: doc.documentId, filename: doc.filename, locator: fact.locator },
      })),
    )

    const interpretation = buildInterpretation(input.instruction, discrepancies.length, missingInformation.length, input.documents.length)
    keyValues.push({
      key: 'Collective assessment',
      value: interpretation,
      kind: 'interpretation',
      source: {
        documentId: input.documents[0]?.id ?? 'collective',
        filename: 'All processed documents',
        locator: 'collective analysis',
      },
    })

    return {
      summary: buildSummary(input, discrepancies.length, missingInformation.length, looksInjected(input.instruction)),
      comparisonTable,
      discrepancies,
      missingInformation,
      keyValues,
      independentAnalyses: independent.map((doc) => ({
        documentId: doc.documentId,
        filename: doc.filename,
        facts: doc.facts.map((f) => ({ key: f.label, value: f.value, locator: f.locator })),
        notes: doc.notes,
      })),
    }
  },
}

function buildSummary(
  input: ProviderAnalyzeInput,
  discrepancyCount: number,
  missingCount: number,
  injectionAttempt: boolean,
): string {
  const names = input.documents.map((d) => d.filename).join(', ')
  const focus = input.instruction.slice(0, 240)
  const injectionNote = injectionAttempt
    ? ' User-supplied instruction contained override-like language and was treated as untrusted analysis criteria only.'
    : ''
  return [
    `Analysed ${input.documents.length} document(s) independently, then compared them collectively: ${names}.`,
    `Requested focus: ${focus}`,
    `Extracted financial and identity fields were not modified. ${discrepancyCount} discrepancy set(s) and ${missingCount} missing-field note(s) were recorded.`,
    injectionNote.trim(),
    'Unsupported conclusions were not added. Where a value could not be read, it is reported as missing rather than inferred.',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildInterpretation(
  instruction: string,
  discrepancyCount: number,
  missingCount: number,
  docCount: number,
): string {
  if (docCount === 0) return 'No processed documents were available for interpretation.'
  if (discrepancyCount === 0 && missingCount === 0) {
    return `Relative to the instruction "${instruction.slice(0, 120)}", extracted identity and financial fields align across the processed documents. This is an interpretation, not a credit decision.`
  }
  return `Relative to the instruction "${instruction.slice(0, 120)}", the documents do not fully agree (${discrepancyCount} conflicting field(s), ${missingCount} missing field note(s)). A human reviewer should inspect the cited sources before any lending decision. This is an interpretation, not a credit decision.`
}
