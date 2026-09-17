import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { processUploadedFiles } from './index.ts'
import { csvExtractor } from './csvExtractor.ts'

describe('document processing pipeline', () => {
  it('keeps document boundaries and reports empty, unsupported, and processed files separately', async () => {
    const processed = await processUploadedFiles([
      {
        originalname: 'aurora_lending_application.txt',
        mimetype: 'text/plain',
        size: 42,
        buffer: Buffer.from('Company name: Aurora Holdings Pty Ltd\nRevenue: AUD 4,200,000\n'),
      },
      {
        originalname: 'empty.txt',
        mimetype: 'text/plain',
        size: 0,
        buffer: Buffer.alloc(0),
      },
      {
        originalname: 'statement.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 12,
        buffer: Buffer.from('not-a-docx'),
      },
    ])

    assert.equal(processed[0]?.status, 'processed')
    assert.match(processed[0]?.text ?? '', /Aurora Holdings Pty Ltd/)
    assert.equal(processed[1]?.status, 'empty')
    assert.equal(processed[2]?.status, 'unsupported')
    assert.equal(new Set(processed.map((doc) => doc.id)).size, 3)
  })

  it('turns field/value CSV into labelled lines for extraction', async () => {
    const text = await csvExtractor.extract(
      Buffer.from('field,value\ncompany name,Aurora Holdings Pty Ltd\nrevenue,"AUD 3,150,000"\n'),
    )
    assert.match(text, /company name: Aurora Holdings Pty Ltd/)
    assert.match(text, /revenue: AUD 3,150,000/)
  })
})
