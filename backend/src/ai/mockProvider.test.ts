import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mockAnalysisProvider } from './mockProvider.ts'

describe('mock analysis provider', () => {
  it('compares documents independently and reports a revenue discrepancy with source ids', async () => {
    const applicationId = '11111111-1111-1111-1111-111111111111'
    const financialsId = '22222222-2222-2222-2222-222222222222'

    const result = await mockAnalysisProvider.analyze({
      instruction: 'Compare the financial position of the companies represented in the documents.',
      documents: [
        {
          id: applicationId,
          filename: 'aurora_lending_application.txt',
          truncated: false,
          text: [
            'Company name: Aurora Holdings Pty Ltd',
            'Applicant: Priya Raman',
            'Address: 12 Harbour Street, Sydney NSW 2000',
            'Licence number: ACL-440221',
            'Revenue: AUD 4,200,000',
            'Date: 2025-07-01',
            'Obligation: Working capital facility AUD 750,000',
          ].join('\n'),
        },
        {
          id: financialsId,
          filename: 'aurora_financials.csv',
          truncated: false,
          text: [
            'CSV document',
            'Company name: Aurora Holdings Pty Ltd',
            'Address: 88 River Road, Sydney NSW 2000',
            'Revenue: AUD 3,150,000',
            'Reporting period: FY2025',
          ].join('\n'),
        },
      ],
    })

    const revenue = result.discrepancies.find((item) => item.field.toLowerCase() === 'revenue')
    assert.ok(revenue, 'expected a revenue discrepancy')
    assert.equal(revenue.values.length, 2)
    assert.ok(revenue.values.some((v) => v.documentId === applicationId))
    assert.ok(revenue.values.some((v) => v.documentId === financialsId))

    const addressMissingOrDiff = result.discrepancies.find((item) => item.field.toLowerCase() === 'address')
    assert.ok(addressMissingOrDiff, 'expected an address discrepancy')

    assert.equal(result.independentAnalyses.length, 2)
    assert.ok(result.keyValues.every((kv) => kv.source.documentId))
    assert.ok(result.keyValues.some((kv) => kv.kind === 'fact'))
    assert.ok(result.keyValues.some((kv) => kv.kind === 'interpretation'))
  })
})
