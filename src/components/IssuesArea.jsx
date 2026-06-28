function groupIssues(issues) {
  return issues.reduce((groups, issue) => {
    const key = issue.type || 'Unknown issue'
    groups[key] = groups[key] || []
    groups[key].push(issue)
    return groups
  }, {})
}

export default function IssuesArea({
  issues = [],
  semanticIndex = {},
  selectedIssue,
  selectedNodeId,
  onSelectIssue,
  onSelectNode
}) {
  const groupedIssues = groupIssues(issues)
  const issueTypes = Object.keys(groupedIssues)

  return (
    <section className="section-block" aria-labelledby="issues-title">
      <div className="section-header">
        <div>
          <p className="eyebrow">Issues</p>
          <h2 id="issues-title">Visibility blockers</h2>
        </div>
        <span className="section-count">{issues.length} total</span>
      </div>

      {issueTypes.length === 0 ? (
        <div className="empty-state">No issues detected by the current checks.</div>
      ) : (
        <div className="issues-list">
          {issueTypes.map(type => {
            const items = groupedIssues[type]
            const isSelected = selectedIssue === type
            const affectedNodes = getAffectedNodes(items, semanticIndex)

            return (
              <article className={`issue-card ${isSelected ? 'selected' : ''}`} key={type}>
                <button
                  className="issue-row"
                  type="button"
                  onClick={() => onSelectIssue(type)}
                >
                  <span>
                    <strong>{type}</strong>
                    <small>
                      {items[0]?.severity || 'notice'}
                      {' / '}
                      {affectedNodes.length || 'no'} affected elements
                    </small>
                  </span>
                  <b>{items.length}</b>
                </button>

                {affectedNodes.length > 0 && (
                  <div className="affected-elements">
                    <small>Affected Elements</small>
                    <div>
                      {affectedNodes.map(node => (
                        <button
                          className={`affected-node-btn ${selectedNodeId === node.id ? 'active' : ''}`}
                          style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', alignItems: 'flex-start', gap: '0.25rem' }}
                          key={node.id}
                          type="button"
                          onClick={() => {
                            onSelectIssue(type)
                            onSelectNode(node.id)
                          }}
                        >
                          <strong>{humanize(node.type || 'Node')}</strong>
                          <span>{getNodeLabelText(node)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Debug Audit View */}
                {isSelected && items[0]?.reason && (
                  <div className="issue-debug-audit" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-surface-2)', fontSize: '0.8rem', borderRadius: '4px' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: items[0].confidence === 'High' ? 'var(--accent-1)' : 'var(--text-secondary)' }}>
                        Confidence: {items[0].confidence}
                      </span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Reason:</strong> {items[0].reason}
                    </div>
                    {affectedNodes.map(node => (
                      <div key={`debug-${node.id}`} style={{ padding: '0.5rem', borderLeft: '2px solid var(--border-color)', marginBottom: '0.5rem' }}>
                        <div><strong>ID:</strong> {node.id}</div>
                        <div><strong>Role:</strong> {node.type}</div>
                        <div><strong>Label:</strong> {node.label || 'none'}</div>
                        <div><strong>Context:</strong> {node.context || 'none'}</div>
                        <div><strong>Selector:</strong> {node.selector}</div>
                        <div><strong>Size:</strong> {node.bbox ? `${node.bbox.w}x${node.bbox.h}` : 'none'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function getAffectedNodes(items, semanticIndex) {
  const seen = new Set()

  return items
    .flatMap(item => item.nodeIds || [])
    .filter(nodeId => {
      if (seen.has(nodeId)) return false
      seen.add(nodeId)
      return true
    })
    .map(nodeId => semanticIndex[nodeId])
    .filter(Boolean)
}

function getNodeLabelText(node) {
  const label = node.label?.replace(/\s+/g, ' ').trim()
  if (label) {
    return label.length <= 34 ? label : `${label.slice(0, 31).trim()}...`
  }
  if (node.context) {
    return node.context
  }
  return 'Unknown Context'
}

function humanize(value) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}
