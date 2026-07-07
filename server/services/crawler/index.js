/**
 * Crawler Engine Orchestrator — Single analysis pipeline.
 *
 * Coordinates: fetchers → robotsParser → sitemapParser → pageProber → issueDetector
 * Returns one normalized JSON model.
 */

import { fetchText } from './fetchers.js'
import { parseRobotsTxt } from './robotsParser.js'
import { parseSitemaps } from './sitemapParser.js'
import { probePages } from './pageProber.js'
import { detectIssues } from './issueDetector.js'

/**
 * Run the full crawler analysis pipeline for a URL.
 * @param {string} targetUrl
 * @returns {object} Normalized crawler analysis result
 */
export async function analyzeCrawler(targetUrl) {
  const startTime = Date.now()

  // 1. Derive origin
  let origin
  try {
    const u = new URL(targetUrl)
    origin = `${u.protocol}//${u.hostname}${u.port ? ':' + u.port : ''}`
  } catch (err) {
    throw new Error(`Invalid URL: ${targetUrl}`, { cause: err })
  }

  // 2. Fetch & parse robots.txt
  const robotsUrl = `${origin}/robots.txt`
  const robotsRes = await fetchText(robotsUrl)
  const robotsFound = robotsRes.ok && robotsRes.status === 200
  const robotsParsed = robotsFound ? parseRobotsTxt(robotsRes.body) : null

  const robots = {
    found: robotsFound,
    url: robotsUrl,
    status: robotsRes.status,
    timing: robotsRes.timing,
    parsed: robotsParsed,
    raw: robotsFound ? robotsRes.body : null
  }

  // 3. Fetch & parse sitemaps
  const sitemapRefs = robotsParsed?.sitemapReferences || []
  const sitemaps = await parseSitemaps(origin, sitemapRefs)

  // 4. Probe discovered pages
  const urlsToProbe = [
    targetUrl,
    ...sitemaps.urls.map(u => u.loc)
  ]
  const pages = await probePages(urlsToProbe, origin)

  // 5. Detect issues
  const issues = detectIssues({ robots, sitemaps, pages, origin })

  // 6. Calculate score
  const { score, scoreBreakdown } = calculateScore(robots, sitemaps, pages, issues)

  const elapsed = Date.now() - startTime

  return {
    url: targetUrl,
    origin,
    analyzedAt: new Date().toISOString(),
    elapsed,
    robots: {
      found: robots.found,
      url: robots.url,
      status: robots.status,
      timing: robots.timing,
      raw: robots.raw,
      rules: robotsParsed?.groups || [],
      sitemapReferences: robotsParsed?.sitemapReferences || [],
      crawlDelays: robotsParsed?.crawlDelays || {},
      aiCrawlerPermissions: robotsParsed?.aiCrawlerPermissions || {}
    },
    sitemaps: {
      discovered: sitemaps.discovered,
      totalUrls: sitemaps.totalUrls,
      urls: sitemaps.urls.slice(0, 500), // Cap for response size
      health: sitemaps.health,
      errors: sitemaps.errors
    },
    pages: {
      probed: pages.probed,
      pageSignals: pages.pageSignals,
      summary: pages.summary,
      sampleSize: pages.sampleSize,
      totalDiscovered: pages.totalDiscovered
    },
    score,
    scoreBreakdown,
    issues
  }
}

/**
 * Score the crawler access health (0–100).
 */
function calculateScore(robots, sitemaps, pages, issues) {
  let score = 100
  const breakdown = []

  const apply = (label, delta, condition) => {
    if (condition) {
      score += delta
      breakdown.push({ label, value: delta })
    }
  }

  // robots.txt
  apply('robots.txt found', 0, robots.found)
  apply('robots.txt missing', -5, !robots.found)
  apply('robots.txt blocks all crawlers', -30, issues.some(i => i.type === 'robots-blocks-all'))

  // AI crawlers
  const blockedAi = issues.filter(i => i.type === 'ai-crawler-blocked')
  apply(`${blockedAi.length} AI crawler(s) fully blocked`, -blockedAi.length * 8, blockedAi.length > 0)

  const partialAi = issues.filter(i => i.type === 'ai-crawler-partial')
  apply(`${partialAi.length} AI crawler(s) partially blocked`, -partialAi.length * 3, partialAi.length > 0)

  // Sitemaps
  apply('Sitemap found', 0, sitemaps.discovered.some(s => s.ok))
  apply('Sitemap missing', -10, !sitemaps.discovered.some(s => s.ok))
  apply('Sitemap not in robots.txt', -3, issues.some(i => i.type === 'sitemap-not-in-robots'))
  apply('Sitemap parse errors', -5, sitemaps.errors.length > 0)

  // Page health
  const httpErrors = issues.filter(i => i.type === 'http-error')
  apply(`${httpErrors.length} HTTP error(s)`, -Math.min(httpErrors.length * 3, 15), httpErrors.length > 0)

  const redirectChains = issues.filter(i => i.type === 'redirect-chain')
  apply(`${redirectChains.length} redirect chain(s)`, -Math.min(redirectChains.length * 2, 10), redirectChains.length > 0)

  const noindexInSitemap = issues.filter(i => i.type === 'noindex-in-sitemap')
  apply(`${noindexInSitemap.length} noindex page(s) in sitemap`, -noindexInSitemap.length * 5, noindexInSitemap.length > 0)

  const blockedInSitemap = issues.filter(i => i.type === 'blocked-in-sitemap')
  apply(`${blockedInSitemap.length} robots-blocked URL(s) in sitemap`, -blockedInSitemap.length * 5, blockedInSitemap.length > 0)

  const slowPages = issues.filter(i => i.type === 'slow-response')
  apply(`${slowPages.length} slow page(s)`, -Math.min(slowPages.length * 2, 8), slowPages.length > 0)

  score = Math.max(0, Math.min(100, score))

  return { score, scoreBreakdown: breakdown }
}
