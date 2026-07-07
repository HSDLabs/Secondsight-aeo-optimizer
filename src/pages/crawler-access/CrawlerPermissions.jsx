import { AI_CRAWLERS, getBotStatusLabel, getBotRulesContent } from './crawlerUtils'

export default function CrawlerPermissions({ robots }) {
  return (
    <section className="section-block" aria-labelledby="crawler-access-title">
      <div className="crawler-section-header">
        <div>
          <p className="eyebrow">Diagnostic Layer</p>
          <h2 id="crawler-access-title">Crawler Permissions</h2>
          <p>Directives resolved for each search agent based on your robots.txt configuration.</p>
        </div>
        <span className="crawler-step-tag">Step 1</span>
      </div>

      <div className="crawler-access-list">
        {AI_CRAWLERS.map(bot => {
          const status = getBotStatusLabel(robots, bot.ua)
          const statusClass = status.toLowerCase()
          return (
            <div key={bot.ua} className="crawler-row">
              <div className="crawler-identity">
                <div className={`crawler-avatar ${bot.avatarClass}`}>
                  {bot.letter}
                </div>
                <div>
                  <span className="crawler-name">{bot.name}</span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--faint)' }}>{bot.desc}</p>
                </div>
              </div>

              <div>
                <span className={`crawler-status-badge ${statusClass}`}>
                  {status}
                </span>
              </div>

              <div className="crawler-ua">
                User-Agent: {bot.ua}
              </div>

              {/* Hover Details Panel */}
              <div className="crawler-hover-details">
                <div className="hover-details-title">Effective Rules in robots.txt</div>
                <pre className="hover-details-content">
                  {getBotRulesContent(robots, bot.ua)}
                </pre>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
