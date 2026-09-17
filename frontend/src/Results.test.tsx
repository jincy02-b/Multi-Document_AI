import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Results } from './Results'
import { sampleAnalyzeResult } from './test/sampleResult'

describe('Results', () => {
  it('renders comparison, discrepancy, missing information, and provenance', () => {
    render(<Results result={sampleAnalyzeResult} />)

    expect(screen.getByText('Structured comparison table')).toBeInTheDocument()
    expect(screen.getAllByText('AUD 4,200,000').length).toBeGreaterThan(1)
    expect(screen.getAllByText('AUD 3,150,000').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/Extracted values for Revenue are not consistent across documents/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Licence number/)).toBeInTheDocument()
    expect(screen.getAllByText('empty.txt').length).toBeGreaterThan(0)
    expect(screen.getByText('fact')).toBeInTheDocument()
    expect(screen.getByText('interpretation')).toBeInTheDocument()
    expect(screen.getByText(/source: aurora_lending_application.txt/)).toBeInTheDocument()
  })
})
