import type { AnalyzeResult } from '@shared/types'

export const sampleAnalyzeResult: AnalyzeResult = {
  analysisId: 'analysis-1',
  instruction: 'Identify inconsistencies between the application form and supporting documents.',
  summary: 'Revenue figures do not match across the processed documents.',
  comparisonTable: [
    {
      field: 'Revenue',
      values: [
        { documentId: 'doc-app', filename: 'aurora_lending_application.txt', value: 'AUD 4,200,000' },
        { documentId: 'doc-csv', filename: 'aurora_financials.csv', value: 'AUD 3,150,000' },
      ],
    },
  ],
  discrepancies: [
    {
      field: 'Revenue',
      description: 'Extracted values for Revenue are not consistent across documents.',
      values: [
        { documentId: 'doc-app', filename: 'aurora_lending_application.txt', value: 'AUD 4,200,000' },
        { documentId: 'doc-csv', filename: 'aurora_financials.csv', value: 'AUD 3,150,000' },
      ],
    },
  ],
  missingInformation: [
    {
      field: 'Licence number',
      note: 'This field was present in another uploaded document but could not be read here.',
      source: { documentId: 'doc-csv', filename: 'aurora_financials.csv' },
    },
  ],
  keyValues: [
    {
      key: 'Revenue',
      value: 'AUD 4,200,000',
      kind: 'fact',
      source: { documentId: 'doc-app', filename: 'aurora_lending_application.txt', locator: 'line 10' },
    },
    {
      key: 'Collective assessment',
      value: 'This is an interpretation, not a credit decision.',
      kind: 'interpretation',
      source: { documentId: 'doc-app', filename: 'All processed documents', locator: 'collective analysis' },
    },
  ],
  independentAnalyses: [
    {
      documentId: 'doc-app',
      filename: 'aurora_lending_application.txt',
      status: 'processed',
      facts: [
        {
          key: 'Revenue',
          value: 'AUD 4,200,000',
          kind: 'fact',
          source: { documentId: 'doc-app', filename: 'aurora_lending_application.txt', locator: 'line 10' },
        },
      ],
      notes: [],
    },
    {
      documentId: 'doc-empty',
      filename: 'empty.txt',
      status: 'empty',
      facts: [],
      notes: ['The file is empty.'],
    },
  ],
  documents: [
    { documentId: 'doc-app', filename: 'aurora_lending_application.txt', status: 'processed', truncated: false },
    { documentId: 'doc-csv', filename: 'aurora_financials.csv', status: 'processed', truncated: false },
    { documentId: 'doc-empty', filename: 'empty.txt', status: 'empty', error: 'The file is empty.', truncated: false },
  ],
}
