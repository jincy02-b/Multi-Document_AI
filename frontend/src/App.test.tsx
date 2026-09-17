import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('blocks analysis until a document is selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: /multi-document intelligence workbench/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /run analysis/i }))
    expect(screen.getByText('Upload at least one document.')).toBeInTheDocument()
  })
})
