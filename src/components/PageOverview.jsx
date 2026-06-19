import ScoreBar from './ScoreBar'

function formatUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.href
  } catch {
    return url
  }
}

export default function PageOverview({ data, score, issueCount }) {
  const wordCount = data?.readable?.wordCount ?? 0

  return (
    <section className="overview-card" aria-labelledby="overview-title">
      <div className="overview-main">
        <p className="eyebrow">Page Overview</p>
        <h2 id="overview-title">{data.title || data.readable?.title || 'Untitled page'}</h2>
        <a href={data.url} target="_blank" rel="noreferrer">
          {formatUrl(data.url)}
        </a>
      </div>

      <div className="overview-stats" aria-label="Analysis summary">
        <div className="stat">
          <span>Words</span>
          <strong>{wordCount.toLocaleString()}</strong>
        </div>
        <div className="stat">
          <span>Issues</span>
          <strong>{issueCount}</strong>
        </div>
        <div className="stat score-stat">
          <span>AI Visibility</span>
          <strong>{score}</strong>
          <ScoreBar score={score} />
        </div>
      </div>
    </section>
  )
}
