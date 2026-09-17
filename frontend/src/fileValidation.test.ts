import { describe, expect, it } from 'vitest'
import { validateFiles } from './fileValidation'

function file(name: string, size: number, type = 'text/plain'): File {
  return new File([new Uint8Array(size)], name, { type })
}

describe('validateFiles', () => {
  it('requires at least one document', () => {
    expect(validateFiles([])).toBe('Upload at least one document.')
  })

  it('rejects unsupported formats and oversize files', () => {
    expect(validateFiles([file('statement.docx', 10)])).toContain('not an allowed format')
    expect(validateFiles([file('huge.txt', 2 * 1024 * 1024 + 1)])).toContain('exceeds 2 MB')
  })

  it('allows mixed PDF/CSV/TXT including empty files', () => {
    expect(
      validateFiles([
        file('aurora_lending_application.txt', 20),
        file('aurora_financials.csv', 20, 'text/csv'),
        file('empty.txt', 0),
      ]),
    ).toBeNull()
  })
})
