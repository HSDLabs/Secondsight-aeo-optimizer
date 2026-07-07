import { getScoreTone, AI_CRAWLERS } from './crawlerUtils'

export default function CrawlerHealthOverview({ score, botsAllowedCount, botsBlockedCount, botsLimitedCount, sitemaps, parsedSitemapsCount, totalSitemapsCount, criticalIssuesCount }) {
  return (
    <section className="health-overview-grid" aria-label="Crawlability health overview">
      <div className="health-card">
        <span className="health-card-label">Overall Crawlability</span>
        <div className={`health-card-value ${getScoreTone(score)}`}>
          {score}
          <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--muted)', marginLeft: '4px' }}>/100</span>
        </div>
        <span className="health-card-subtext">Overall visibility score</span>
      </div>

      <div className="health-card">
        <span className="health-card-label">Bots Allowed</span>
        <div className="health-card-value">
          {botsAllowedCount}
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--faint)' }}> / {AI_CRAWLERS.length}</span>
        </div>
        <span className="health-card-subtext">
          {botsBlockedCount} blocked, {botsLimitedCount} limited
        </span>
      </div>

      <div className="health-card">
        <span className="health-card-label">Pages Discoverable</span>
        <div className="health-card-value good">
          {sitemaps?.totalUrls || 0}
        </div>
        <span className="health-card-subtext">
          Found in {parsedSitemapsCount} of {totalSitemapsCount} sitemaps
        </span>
      </div>

      <div className="health-card">
        <span className="health-card-label">Critical Issues</span>
        <div className={`health-card-value ${criticalIssuesCount > 0 ? 'poor' : 'good'}`}>
          {criticalIssuesCount}
        </div>
        <span className="health-card-subtext">Blockers requiring action</span>
      </div>
    </section>
  )
}
