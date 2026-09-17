import type { Extractor } from './types.ts'

function parseCsv(text: string): string {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length === 0) return ''
  const headers = splitCsvLine(lines[0] ?? '').map((header) => header.trim())
  const rows = lines.slice(1).map((line) => splitCsvLine(line))
  const normalized = headers.map((header) => header.toLowerCase())
  if (normalized.length >= 2 && normalized[0] === 'field' && normalized[1] === 'value') {
    return rows
      .map((row) => `${(row[0] ?? '').trim()}: ${(row[1] ?? '').trim()}`)
      .filter((line) => line !== ':')
      .join('\n')
  }
  const rendered = rows.map((row, i) => {
    const pairs = headers.map((header, idx) => `${header.trim()}: ${(row[idx] ?? '').trim()}`)
    return `Row ${i + 1}: ${pairs.join(' | ')}`
  })
  return ['CSV document', `Columns: ${headers.join(', ')}`, ...rendered].join('\n')
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

export const csvExtractor: Extractor = {
  ext: '.csv',
  async extract(buffer) {
    return parseCsv(buffer.toString('utf8')).trim()
  },
}
