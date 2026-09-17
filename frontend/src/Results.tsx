import type { AnalyzeResult } from '@shared/types'

export function Results({ result }: { result: AnalyzeResult }) {
  const processed = result.documents.filter((doc) => doc.status === 'processed')

  return (
    <div className="results">
      <h3>Document statuses</h3>
      <ul className="status-list">
        {result.documents.map((doc) => (
          <li key={doc.documentId}>
            <span className={`pill pill-${doc.status}`}>{doc.status}</span>
            <strong>{doc.filename}</strong>
            <span className="muted">{doc.documentId.slice(0, 8)}</span>
            {doc.error ? <span>{doc.error}</span> : null}
            {doc.truncated ? <span>truncated</span> : null}
          </li>
        ))}
      </ul>

      <h3>Independent document analysis</h3>
      {result.independentAnalyses.map((doc) => (
        <article className="independent" key={doc.documentId}>
          <header>
            <span className={`pill pill-${doc.status}`}>{doc.status}</span>
            <strong>{doc.filename}</strong>
          </header>
          {doc.notes.length > 0 ? <p className="muted">{doc.notes.join(' ')}</p> : null}
          {doc.facts.length === 0 ? (
            <p className="muted">No extracted facts for this document.</p>
          ) : (
            <ul>
              {doc.facts.map((fact) => (
                <li key={`${doc.documentId}-${fact.key}`}>
                  <strong>{fact.key}:</strong> {fact.value}
                  <span className="muted"> · {fact.source.locator ?? 'document'}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}

      <h3>Consolidated summary</h3>
      <p>{result.summary}</p>

      <h3>Structured comparison table</h3>
      {result.comparisonTable.length === 0 ? (
        <p className="muted">No comparable fields were extracted.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                {processed.map((doc) => (
                  <th key={doc.documentId}>
                    {doc.filename}
                    <div className="muted">{doc.documentId.slice(0, 8)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.comparisonTable.map((row) => (
                <tr key={row.field}>
                  <td>{row.field}</td>
                  {processed.map((doc) => (
                    <td key={doc.documentId}>
                      {row.values.find((cell) => cell.documentId === doc.documentId)?.value ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Discrepancies</h3>
      {result.discrepancies.length === 0 ? (
        <p className="muted">No discrepancies were identified in extracted facts.</p>
      ) : (
        <ul>
          {result.discrepancies.map((item) => (
            <li key={item.field}>
              <strong>{item.field}</strong> — {item.description}
              <ul>
                {item.values.map((cell) => (
                  <li key={cell.documentId}>
                    {cell.filename}: {cell.value}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <h3>Missing-information report</h3>
      {result.missingInformation.length === 0 ? (
        <p className="muted">No missing labelled fields were reported.</p>
      ) : (
        <ul>
          {result.missingInformation.map((item) => (
            <li key={`${item.source.documentId}-${item.field}`}>
              <strong>{item.field}</strong> in {item.source.filename}: {item.note}
            </li>
          ))}
        </ul>
      )}

      <h3>Key-value extraction</h3>
      <ul className="kv">
        {result.keyValues.map((item, index) => (
          <li key={`${item.key}-${item.source.documentId}-${index}`}>
            <span className={`kind kind-${item.kind}`}>{item.kind}</span>
            <span>
              <strong>{item.key}:</strong> {item.value}
            </span>
            <span className="muted">
              source: {item.source.filename}
              {item.source.locator ? ` · ${item.source.locator}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
