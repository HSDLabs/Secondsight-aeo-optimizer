import { getProgressMetrics, getSectionMetrics } from './progressiveAnalysis'

const STATUS_LABELS = {
  waiting: 'Waiting',
  processing: 'Processing',
  success: 'Ready',
  warning: 'Needs attention'
}

export default function ProgressSummary({ progressState, loading, analyzedAt }) {
  const metrics = getProgressMetrics(progressState)
  const sections = progressState?.sections || []
  const activeCheck = metrics.activeCheck
  const activeSection = metrics.activeSection
  const hostLabel = progressState?.host || progressState?.url || 'Waiting for URL'
  const statusLabel = progressState?.phase === 'error'
    ? 'Analysis interrupted'
    : STATUS_LABELS[metrics.overallStatus] || 'Waiting'

  return (
    <section className="progress-summary section-block" aria-labelledby="progress-summary-title">
      <div className="progress-hero">
        <div className="progress-hero-copy">
          <p className="eyebrow">Summary</p>
          <h2 id="progress-summary-title">AI Understanding (AI Comprehension)</h2>
          <p className="progress-lead">
            The new summary view updates one check at a time so the page feels progressive while the
            existing raw views stay available below.
          </p>

          <div className="progress-chip-row" aria-label="analysis status">
            <span className={`progress-chip status-${metrics.overallStatus}`}>
              {statusLabel}
            </span>
            <span className="progress-chip muted">{hostLabel}</span>
            <span className="progress-chip muted">
              {loading ? 'Fetching backend results' : analyzedAt ? 'Backend results ready' : 'Frontend simulation'}
            </span>
          </div>

          <p className="progress-focus">
            {activeCheck
              ? `Now checking ${activeCheck.label}${activeSection ? ` in ${activeSection.title}` : ''}`
              : progressState?.phase === 'complete'
              ? 'Simulated progress complete.'
              : 'Waiting for analysis to start.'}
          </p>
        </div>

        <div className="progress-hero-aside">
          <div className="progress-mini-metrics">
            <div>
              <strong>{metrics.completedChecks}</strong>
              <span>resolved</span>
            </div>
            <div>
              <strong>{metrics.waitingChecks}</strong>
              <span>waiting</span>
            </div>
            <div>
              <strong>{metrics.warningChecks}</strong>
              <span>flags</span>
            </div>
          </div>
          <p className="progress-hero-note">
            {analyzedAt ? 'Backend results have arrived.' : 'The page updates immediately while the fetch continues.'}
          </p>
        </div>
      </div>

      <div className="progress-board">
        <div className="progress-board-score">
          <div className="progress-score-label">AI Comprehension Score</div>
          <div className="progress-ring large" style={{ '--progress': metrics.completion }}>
            <div className="progress-ring-inner">
              <strong>{metrics.completion}</strong>
              <span>/100</span>
            </div>
          </div>
          <div className="progress-score-copy">
            <span className={`progress-chip status-${metrics.overallStatus}`}>
              {statusLabel}
            </span>
            <p>{metrics.completedChecks} checks resolved across {metrics.totalChecks} total signals.</p>
          </div>
        </div>

        <div className="progress-section-grid">
          {sections.map((section, index) => (
            <ProgressSectionCard key={section.id} section={section} index={index} />
          ))}
        </div>
      </div>

      <div className="progress-footer">
        <span>Frontend simulation only</span>
        <span>Designed to accept live progress events later without changing the card layout.</span>
      </div>
    </section>
  )
}

function ProgressSectionCard({ section, index = 0 }) {
  const metrics = getSectionMetrics(section)

  return (
    <article className={`progress-card status-${metrics.status}`} style={{ '--card-delay': `${index * 70}ms` }}>
      <div className="progress-card-header">
        <div>
          <p className="progress-card-title">{section.title}</p>
          <p className="progress-card-subtitle">{section.subtitle}</p>
        </div>
        <span className={`progress-card-count status-${metrics.status}`}>
          {metrics.completedChecks}/{metrics.totalChecks}
        </span>
      </div>

      <div className="check-list">
        {section.checks.map(check => (
          <ProgressCheckRow key={check.id} check={check} />
        ))}
      </div>
    </article>
  )
}

function ProgressCheckRow({ check }) {
  const isSettled = check.status === 'success' || check.status === 'warning'

  return (
    <div className={`check-row status-${check.status}`}>
      <StatusIcon status={check.status} />

      <div className="check-copy">
        <span className="check-label">{check.label}</span>
      </div>

      <div className={`check-value ${isSettled ? 'revealed' : ''}`}>
        <span>{isSettled ? check.value : '—'}</span>
      </div>

      <div className={`check-confidence ${isSettled ? 'revealed' : ''}`}>
        <span>{isSettled ? check.confidence : '—'}</span>
      </div>
    </div>
  )
}

function StatusIcon({ status }) {
  if (status === 'processing') {
    return <span className="status-icon processing" aria-hidden="true" />
  }

  if (status === 'success') {
    return (
      <span className="status-icon success" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 10.5 8.2 14 15.5 6.5" />
        </svg>
      </span>
    )
  }

  if (status === 'warning') {
    return (
      <span className="status-icon warning" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3.5 17 16H3L10 3.5Z" />
          <path d="M10 7v4" />
          <path d="M10 13.8h.01" />
        </svg>
      </span>
    )
  }

  return <span className="status-icon waiting" aria-hidden="true" />
}
