/**
 * Quick smoke test for the crawler engine.
 * Run: node server/services/crawler/test.js
 */

/* global process */
import { analyzeCrawler } from './index.js'

const url = process.argv[2] || 'https://example.com'

console.log(`\n🔍 Analyzing crawler access for: ${url}\n`)

try {
  const result = await analyzeCrawler(url)

  console.log('✅ Analysis complete in', result.elapsed, 'ms\n')

  console.log('── robots.txt ──')
  console.log('  Found:', result.robots.found)
  console.log('  Sitemap refs:', result.robots.sitemapReferences.length)
  console.log('  AI permissions:', JSON.stringify(result.robots.aiCrawlerPermissions, null, 4))

  console.log('\n── Sitemaps ──')
  console.log('  Discovered:', result.sitemaps.discovered.length)
  console.log('  Total URLs:', result.sitemaps.totalUrls)
  console.log('  Health:', JSON.stringify(result.sitemaps.health, null, 4))

  console.log('\n── Pages ──')
  console.log('  Probed:', result.pages.summary.pagesProbed)
  console.log('  Avg response:', result.pages.summary.avgResponseTime, 'ms')
  console.log('  Status codes:', JSON.stringify(result.pages.summary.statusCodes))

  console.log('\n── Score ──')
  console.log('  Score:', result.score, '/ 100')
  for (const item of result.scoreBreakdown) {
    console.log(`  ${item.value > 0 ? '+' : ''}${item.value} — ${item.label}`)
  }

  console.log('\n── Issues ──')
  console.log('  Total:', result.issues.length)
  for (const issue of result.issues) {
    const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'
    console.log(`  ${icon} [${issue.type}] ${issue.evidence.slice(0, 80)}`)
  }

  console.log('\n✅ Full JSON response size:', JSON.stringify(result).length, 'bytes')
} catch (err) {
  console.error('❌ Error:', err.message)
  console.error(err.stack)
  process.exit(1)
}
