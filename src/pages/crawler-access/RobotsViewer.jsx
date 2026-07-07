import { getRobotsWarnings } from './crawlerUtils'

export default function RobotsViewer({ robots, sitemaps }) {
  const rawRobotsLines = robots.raw ? robots.raw.split(/\r?\n/) : []
  const warningsByLine = getRobotsWarnings(robots, sitemaps)

  return (
    <section className="section-block" aria-labelledby="robots-viewer-title">
      <div className="crawler-section-header">
        <div>
          <p className="eyebrow">Syntax Check</p>
          <h2 id="robots-viewer-title">Interactive robots.txt</h2>
          <p>Live syntax highlighter of robots.txt directives, cross-referencing validator logs inline.</p>
        </div>
        <span className="crawler-step-tag">Step 2</span>
      </div>

      <div className="robots-viewer-container">
        <div className="robots-viewer-header">
          <div className="robots-file-info">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            <span>{robots.url}</span>
            <span className={`robots-badge ${!robots.found ? 'missing' : ''}`}>
              {robots.found ? `HTTP ${robots.status} OK` : 'Missing'}
            </span>
          </div>
          {robots.timing > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--faint)' }}>Fetched in {robots.timing}ms</span>
          )}
        </div>

        <div className="robots-code-editor">
          {robots.found && rawRobotsLines.length > 0 ? (
            rawRobotsLines.map((line, idx) => {
              const isComment = line.trim().startsWith('#')
              const colonIndex = line.indexOf(':')
              const hasWarning = warningsByLine[idx] !== undefined

              if (isComment) {
                return (
                  <div key={idx} className="robots-line-container">
                    <div className="robots-code-line">
                      <span className="robots-comment">{line}</span>
                    </div>
                  </div>
                )
              }

              if (colonIndex === -1) {
                return (
                  <div key={idx} className="robots-line-container">
                    <div className="robots-code-line">
                      <span className="robots-value">{line}</span>
                    </div>
                  </div>
                )
              }

              const key = line.slice(0, colonIndex).trim()
              const val = line.slice(colonIndex + 1)
              
              let keyClass = 'robots-value'
              const lowerKey = key.toLowerCase()
              if (lowerKey === 'user-agent') keyClass = 'robots-key-ua'
              else if (lowerKey === 'allow') keyClass = 'robots-key-allow'
              else if (lowerKey === 'disallow') keyClass = 'robots-key-disallow'
              else if (lowerKey === 'crawl-delay') keyClass = 'robots-key-delay'
              else if (lowerKey === 'sitemap') keyClass = 'robots-key-sitemap'

              return (
                <div key={idx} className="robots-line-container">
                  <div className="robots-code-line">
                    <span className={keyClass}>{key}:</span>
                    <span className="robots-value">{val}</span>
                  </div>
                  {hasWarning && (
                    <div className={`robots-inline-alert ${warningsByLine[idx].severity}`}>
                      <span className="robots-inline-alert-icon">
                        {warningsByLine[idx].severity === 'critical' ? '✕' : '⚠️'}
                      </span>
                      <span>{warningsByLine[idx].message}</span>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div style={{ padding: '0 20px', color: 'var(--poor)' }}>
              # No robots.txt found. All crawlers allowed by default.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
