// Quick inline test — run with: node server/services/crawler/smoke.mjs
import { parseRobotsTxt, isPathAllowed } from './robotsParser.js'

// Test 1: robots.txt parsing
const robots = parseRobotsTxt(`
User-agent: *
Disallow: /private/
Allow: /public/

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Allow: /

Crawl-delay: 5

Sitemap: https://example.com/sitemap.xml
`)

console.log('=== Test 1: robots.txt parsing ===')
console.log('Groups:', robots.groups.length)
console.log('Sitemap refs:', robots.sitemapReferences)
console.log('Crawl delays:', robots.crawlDelays)
console.log('AI permissions:', JSON.stringify(robots.aiCrawlerPermissions, null, 2))

console.assert(robots.groups.length >= 3, 'Should have at least 3 groups')
console.assert(robots.aiCrawlerPermissions.GPTBot === 'blocked', 'GPTBot should be blocked')
console.assert(robots.aiCrawlerPermissions.ClaudeBot === 'allowed', 'ClaudeBot should be allowed')
console.assert(robots.sitemapReferences.length === 1, 'Should have 1 sitemap ref')

// Test 2: path matching
console.log('\n=== Test 2: path matching ===')
const allowed1 = isPathAllowed(robots.groups, '*', '/public/page')
const blocked1 = isPathAllowed(robots.groups, '*', '/private/secret')
const gptBlocked = isPathAllowed(robots.groups, 'GPTBot', '/')
console.log('/public/page for *:', allowed1, '(expected: true)')
console.log('/private/secret for *:', blocked1, '(expected: false)')
console.log('/ for GPTBot:', gptBlocked, '(expected: false)')
console.assert(allowed1 === true)
console.assert(blocked1 === false)
console.assert(gptBlocked === false)

// Test 3: issue detector (unit)
import { detectIssues } from './issueDetector.js'

const issues = detectIssues({
  robots: {
    found: true,
    parsed: robots
  },
  sitemaps: {
    discovered: [],
    totalUrls: 0,
    urls: [],
    errors: [],
    health: { duplicateUrls: [] }
  },
  pages: {
    probed: [],
    pageSignals: [],
    summary: {}
  },
  origin: 'https://example.com'
})

console.log('\n=== Test 3: issue detection ===')
console.log('Issues found:', issues.length)
for (const i of issues) {
  console.log(`  [${i.severity}] ${i.type}: ${i.evidence.slice(0, 60)}`)
}
console.assert(issues.some(i => i.type === 'ai-crawler-blocked'), 'Should detect GPTBot blocked')
console.assert(issues.some(i => i.type === 'sitemap-not-found'), 'Should detect missing sitemap')

console.log('\n✅ All unit tests passed!')
