export default function CrawlerIssues({ sortedIssues, expandedIssues, setExpandedIssues }) {
  return (
    <section className="section-block" aria-labelledby="crawler-issues-title">
      <div className="crawler-section-header">
        <div>
          <p className="eyebrow">Deduplicated Action Queue</p>
          <h2 id="crawler-issues-title">Crawler Issues</h2>
          <p>Prioritized action queue detailing crawler blockers and indexing issues by severity impact.</p>
        </div>
        <span className="crawler-step-tag">Step 5</span>
      </div>

      <div className="issues-accordion-container">
        {sortedIssues.length > 0 ? (
          sortedIssues.map(issue => {
            const isExpanded = !!expandedIssues[issue.id]
            const severityClass = issue.severity.toLowerCase()
            
            const toggleIssue = () => {
              setExpandedIssues(prev => ({
                ...prev,
                [issue.id]: !prev[issue.id]
              }))
            }

            return (
              <div key={issue.id} className={`issue-accordion-card ${severityClass}`}>
                {/* Header */}
                <div className="issue-accordion-header" onClick={toggleIssue}>
                  <div className="issue-header-left">
                    <span className={`issue-impact-badge ${severityClass}`}>
                      {issue.severity === 'critical' ? 'High Impact' : (issue.severity === 'warning' ? 'Medium Impact' : 'Low Impact')}
                    </span>
                    <span className="issue-title">{issue.evidence.split('\n')[0]}</span>
                  </div>

                  <div className="issue-header-right">
                    {issue.crawlerAffected?.length > 0 && (
                      <span className="issue-bot-affected">
                        Bots: {issue.crawlerAffected.join(', ')}
                      </span>
                    )}
                    <span className={`issue-accordion-arrow ${isExpanded ? 'expanded' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                {isExpanded && (
                  <div className="issue-accordion-content">
                    <div className="issue-content-grid">
                      <div className="issue-content-block">
                        <span className="issue-block-label">Evidence</span>
                        <pre className="issue-evidence-code">{issue.evidence}</pre>
                      </div>
                      
                      <div className="issue-content-block">
                        <span className="issue-block-label">Affected URLs</span>
                        <div className="issue-url-list">
                          {issue.affectedUrls && issue.affectedUrls.length > 0 ? (
                            issue.affectedUrls.map((affUrl, aIdx) => (
                              <span key={aIdx} className="issue-url-item">
                                {affUrl.startsWith('/') || affUrl.startsWith('http') ? affUrl : '/' + affUrl}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--faint)' }}>Whole Domain Affected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="issue-content-block">
                      <span className="issue-block-label">Recommendation</span>
                      <div className="issue-recommendation-text">{issue.recommendation}</div>
                    </div>

                    <div className="issue-content-block">
                      <span className="issue-block-label">Expected Impact</span>
                      <div className="issue-impact-text">
                        Fixing this will re-enable accessibility for {issue.crawlerAffected?.join(', ')}. It restores standard indexing parameters and allows targeted page summarization.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="issues-clean-state">
            <div className="clean-icon">✓</div>
            <h3>No Crawler Issues Found</h3>
            <p>AI crawlers and search agents can discover and index your pages without configuration blockers.</p>
          </div>
        )}
      </div>
    </section>
  )
}
