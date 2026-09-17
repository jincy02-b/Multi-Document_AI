import { describe, expect, it } from 'vitest'
import { formatCopyText } from './api'
import { sampleAnalyzeResult } from './test/sampleResult'

describe('formatCopyText', () => {
  it('includes source documents, discrepancies, and fact vs interpretation labels', () => {
    const text = formatCopyText(sampleAnalyzeResult)

    expect(text).toContain('aurora_lending_application.txt')
    expect(text).toContain('aurora_financials.csv')
    expect(text).toContain('empty.txt [empty]')
    expect(text).toContain('DISCREPANCIES')
    expect(text).toContain('AUD 4,200,000')
    expect(text).toContain('AUD 3,150,000')
    expect(text).toContain('[fact] Revenue')
    expect(text).toContain('[interpretation] Collective assessment')
    expect(text).toContain('INDEPENDENT ANALYSIS')
  })
})
