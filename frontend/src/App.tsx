import { useMemo, useState, type FormEvent } from 'react'
import type { AnalyzeResult } from '@shared/types'
import { analyzeDocuments, formatCopyText } from './api'
import { EXAMPLE_INSTRUCTIONS } from './examples'
import { validateFiles } from './fileValidation'
import { Results } from './Results'

const MAX_FILES = 5

export function App() {
  const [files, setFiles] = useState<File[]>([])
  const [instruction, setInstruction] = useState(EXAMPLE_INSTRUCTIONS[0] ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [copied, setCopied] = useState(false)

  const fileError = useMemo(() => validateFiles(files), [files])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setCopied(false)
    if (fileError) {
      setError(fileError)
      return
    }
    if (instruction.trim().length < 8) {
      setError('Enter an analysis instruction of at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      const data = await analyzeDocuments(files, instruction.trim())
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setBusy(false)
    }
  }

  async function copyOutput() {
    if (!result) return
    await navigator.clipboard.writeText(formatCopyText(result))
    setCopied(true)
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Banking assessment · synthetic data only</p>
        <h1>Multi-Document Intelligence Workbench</h1>
        <p>
          Upload application and supporting files. Each document is extracted independently, then compared
          collectively, with source provenance on every finding.
        </p>
      </header>

      <form className="panel" onSubmit={onSubmit}>
        <label className="label" htmlFor="files">Documents (PDF, CSV, TXT · max {MAX_FILES} files · 2 MB each)</label>
        <input
          id="files"
          className="file"
          type="file"
          multiple
          accept=".pdf,.csv,.txt,application/pdf,text/csv,text/plain"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
        <ul className="file-list">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`}>
              {file.name} · {file.size === 0 ? 'empty' : `${(file.size / 1024).toFixed(1)} KB`}
            </li>
          ))}
        </ul>
        {files.length > 0 && fileError ? <p className="banner error">{fileError}</p> : null}

        <label className="label" htmlFor="instruction">Custom analysis instruction</label>
        <textarea
          id="instruction"
          className="textarea"
          rows={4}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="Describe the analysis you need"
        />
        <div className="chips">
          {EXAMPLE_INSTRUCTIONS.map((example) => (
            <button type="button" key={example} className="chip" onClick={() => setInstruction(example)}>
              {example}
            </button>
          ))}
        </div>

        {error ? <p className="banner error">{error}</p> : null}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Analysing…' : 'Run analysis'}
        </button>
      </form>

      {result ? (
        <section className="panel">
          <div className="results-head">
            <div>
              <h2>Generated output</h2>
              <p className="muted">Analysis {result.analysisId}</p>
            </div>
            <button type="button" className="secondary" onClick={() => void copyOutput()}>
              {copied ? 'Copied' : 'Copy output'}
            </button>
          </div>
          <Results result={result} />
        </section>
      ) : null}
    </div>
  )
}
