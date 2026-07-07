import { generateFix } from './fixes/generateFix'

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'var(--poor)', icon: <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>, bg: 'rgba(255, 107, 107, 0.1)' },
  warning: { label: 'Warning', color: 'var(--warning)', icon: <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>, bg: 'rgba(242, 184, 75, 0.1)' },
  notice: { label: 'Notice', color: 'var(--accent)', icon: <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>, bg: 'rgba(77, 163, 255, 0.1)' }
}

const CONFIDENCE_CONFIG = {
  High: { color: 'var(--good)', label: 'High certainty' },
  Medium: { color: 'var(--warning)', label: 'Medium certainty' },
  Low: { color: 'var(--muted)', label: 'Low certainty' }
}

function getIssueDescription(type) {
  const descriptions = {
    'Missing alt text': 'Image missing alt text. AI systems and screen readers cannot understand this image.',
    'Unlabeled button': 'Button without accessible label. Machines see this as an unknown interactive element.',
    'Empty link': 'Link with no text. AI crawlers cannot understand where this link leads.',
    'Unlabeled input': 'Form input without label. Automated systems cannot determine what data this field expects.',
    'Missing H1': 'No H1 heading found on the page. This removes one of the strongest topical signals for AI systems.'
  }

  if (type.startsWith('Multiple H1s')) {
    return `${type} found. More than one H1 can dilute the primary topic signal.`
  }

  return descriptions[type] || `Instance of "${type}" detected. This may reduce how clearly AI systems understand the page.`
}

export default function IssuesArea({
  issues = [],
  semanticIndex = {},
  selectedIssue,
  selectedNodeId,
  onSelectIssue,
  onSelectNode,
  onIssueAction
}) {
  const criticalCount = issues.filter(issue => issue.severity === 'critical').length
  const warningCount = issues.filter(issue => issue.severity === 'warning').length

  return (
    <section className="section-block issues-section" aria-labelledby="issues-title">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
            LAYER 3: VISIBILITY ISSUES (ACTIONABLE)
          </p>
          <h2 id="issues-title" style={{ fontSize: '1.15rem', color: 'var(--text)', margin: '4px 0 0' }}>
            {issues.length === 0 ? 'Issues that could reduce AI visibility.' : 'Visibility Blockers'}
          </h2>
        </div>
        <div className="issues-summary-badges" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {issues.length === 0 ? (
            <span className="all-clear-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--good)', fontWeight: 600 }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', background: 'rgba(72,199,142,0.1)', borderRadius: '50%', padding: '2px' }}>
                <polyline points="4.5 10.5 8.2 14 15.5 6.5"/>
              </svg>
              All clear
            </span>
          ) : (
            <>
              {criticalCount > 0 && <span className="issue-badge issue-badge-critical">{criticalCount} critical</span>}
              {warningCount > 0 && <span className="issue-badge issue-badge-warning">{warningCount} warning{warningCount > 1 ? 's' : ''}</span>}
            </>
          )}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="issues-clean-state-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="issues-clean-state-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="clean-left-card" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <div className="clean-circle-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(72,199,142,0.1)', color: 'var(--good)', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 650, color: 'var(--text)' }}>AI successfully understood this page</h3>
                <p style={{ margin: '8px 0 0', fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Great job! We didn't find any issues that block AI systems from understanding your content.
                </p>
              </div>
            </div>

            <div className="clean-right-card" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              {[
                'Brand identified',
                'Content extracted',
                'Structure consistent',
                'No accessibility blockers',
                'High confidence across all layers'
              ].map(badge => (
                <div key={badge} className="clean-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text)', fontWeight: 500 }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', color: 'var(--good)', flexShrink: 0 }}>
                    <polyline points="4.5 10.5 8.2 14 15.5 6.5"/>
                  </svg>
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Tip Banner */}
          <div className="tip-banner" style={{ background: 'rgba(77,163,255,0.05)', border: '1px solid rgba(77,163,255,0.15)', borderRadius: '10px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b9dcff', fontSize: '0.85rem' }}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Tip: Keep monitoring your site. Re-run this analysis after major content or structure changes.</span>
            </div>
            <button 
              type="button" 
              className="setup-monitoring-btn" 
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Set up monitoring
            </button>
          </div>
        </div>
      ) : (
        <div className="issues-list">
          {issues.map(issue => {
            const isSelected = selectedIssue === issue.id
            const severity = issue.severity || 'notice'
            const confidence = issue.confidence || 'Medium'
            const sevConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.notice
            const confConfig = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.Medium
            const fix = isSelected ? generateFix(issue.type, issue.element, issue.context) : null

            return (
              <article
                className={`issue-card-v2 ${isSelected ? 'selected' : ''}`}
                key={issue.id}
                style={{ '--severity-color': sevConfig.color }}
              >
                <div className="issue-severity-stripe" style={{ background: sevConfig.color }} />

                <div className="issue-card-content">
                  <div
                    className="issue-click-target"
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectIssue(isSelected ? null : issue.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectIssue(isSelected ? null : issue.id)
                      }
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      outline: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px 16px' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: sevConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sevConfig.icon}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{issue.type}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                        {issue.nodeIds?.length || 1} affected
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '0.85rem', color: confConfig.color }}>
                        {confConfig.label}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>
                        {isSelected ? 'Close' : 'View Issue'}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="issue-body" style={{ marginTop: '0', padding: '0 16px 16px 16px', borderTop: '1px solid var(--border)' }}>
                      <p className="issue-description" style={{ marginTop: '16px' }}>
                        {issue.explanation || getIssueDescription(issue.type)}
                      </p>
                      <div className="issue-fix-container">
                        <dl className="issue-origin-grid">
                          <div>
                            <dt>Evidence</dt>
                            <dd>{issue.evidence || 'Raw analysis'} • {issue.sourcePanel || 'Machine Structure'}</dd>
                          </div>
                          {fix && (
                            <div>
                              <dt>Confidence</dt>
                              <dd>{fix.confidence} • {fix.why}</dd>
                            </div>
                          )}
                        </dl>
                        {fix && (
                          <div className="issue-diff-block">
                            <div className="diff-before">
                              <strong>Before</strong>
                              <code>{fix.before}</code>
                            </div>
                            <div className="diff-after">
                              <strong>After</strong>
                              <code>{fix.after}</code>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {isSelected && issue.nodeIds?.length > 0 && (
                    <div className="issue-affected">
                      <small className="affected-label">Affected Elements</small>
                      <div className="affected-chips">
                        {getAffectedNodes([issue], semanticIndex).slice(0, 6).map(node => (
                          <button
                            className={`affected-chip ${selectedNodeId === node.id ? 'active' : ''}`}
                            key={node.id}
                            type="button"
                            onClick={() => {
                              onSelectIssue(issue.id)
                              onSelectNode(node.id)
                            }}
                          >
                            <span className="chip-role">{humanize(node.type || 'Node')}</span>
                            <span className="chip-label">{getNodeLabelText(node)}</span>
                            {node.context && <span className="chip-context">in {node.context}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSelected && issue.actions?.length > 0 && (
                    <div className="issue-actions-row">
                      {normalizeIssueActions(issue.actions).map(actionItem => (
                        <button
                          key={actionItem.id}
                          type="button"
                          className={`issues-action ${actionItem.kind === 'open-issue' ? 'primary' : ''}`}
                          onClick={() => {
                            onSelectIssue(issue.id)
                            onIssueAction?.({ ...actionItem, issueId: issue.id })
                          }}
                        >
                          {actionItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function normalizeIssueActions(actions) {
  return actions.map(actionItem => (
    actionItem.kind === 'create-issue'
      ? { ...actionItem, kind: 'open-issue', label: 'Open Issue' }
      : actionItem
  ))
}

function humanize(value = '') {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function getNodeLabelText(node) {
  return node?.label || node?.name || node?.text || node?.type || 'Node'
}

function getAffectedNodes(items, semanticIndex) {
  const nodeIds = [...new Set(items.flatMap(issue => issue.nodeIds || []))]
  return nodeIds
    .map(id => semanticIndex[id])
    .filter(Boolean)
}

