function groupIssues(issues) {
  return issues.reduce((groups, issue) => {
    const key = issue.type || 'Unknown issue'
    groups[key] = groups[key] || []
    groups[key].push(issue)
    return groups
  }, {})
}

export default function IssuesArea({ issues = [], selectedIssue, onSelectIssue }) {
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

            return (
              <button
                className={`issue-row ${isSelected ? 'selected' : ''}`}
                key={type}
                type="button"
                onClick={() => onSelectIssue(type)}
              >
                <span>
                  <strong>{type}</strong>
                  <small>{items[0]?.severity || 'notice'}</small>
                </span>
                <b>{items.length}</b>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
