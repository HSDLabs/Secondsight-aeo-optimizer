/**
 * robotsParser.js — Parse robots.txt into a structured model.
 *
 * Produces:
 *   - Per-user-agent rule groups (allow / disallow)
 *   - Crawl delays
 *   - Sitemap references declared in robots.txt
 *   - AI crawler permissions for each known AI bot
 *
 * This is a line-by-line parser — no external dependency needed.
 */

/**
 * Well-known AI crawlers we specifically track.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'Bytespider',
  'CCBot',
  'Applebot',
  'Bingbot',
  'Googlebot'
]

/**
 * Parse a raw robots.txt string into a structured model.
 *
 * @param {string} raw — The full text of robots.txt
 * @returns {object} Parsed result
 */
export function parseRobotsTxt(raw) {
  const lines = raw.split(/\r?\n/)

  /** @type {{ userAgent: string, rules: { type: 'allow'|'disallow', path: string }[] }[]} */
  const groups = []
  const sitemapRefs = []
  const crawlDelays = {}

  let currentAgents = []
  let currentRules = []

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Skip blank lines and comments
    if (!line || line.startsWith('#')) {
      // A blank line between groups: flush current
      if (line === '' && currentAgents.length > 0 && currentRules.length > 0) {
        flushGroup()
      }
      continue
    }

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const directive = line.slice(0, colonIndex).trim().toLowerCase()
    const value = line.slice(colonIndex + 1).trim()

    switch (directive) {
      case 'user-agent': {
        // If we already have rules queued, this is a new group
        if (currentRules.length > 0) flushGroup()
        currentAgents.push(value)
        break
      }

      case 'disallow': {
        if (value !== '') {
          currentRules.push({ type: 'disallow', path: value })
        }
        break
      }

      case 'allow': {
        if (value !== '') {
          currentRules.push({ type: 'allow', path: value })
        }
        break
      }

      case 'crawl-delay': {
        const delay = parseFloat(value)
        if (!isNaN(delay)) {
          for (const agent of currentAgents.length > 0 ? currentAgents : ['*']) {
            crawlDelays[agent] = delay
          }
        }
        break
      }

      case 'sitemap': {
        if (value) sitemapRefs.push(value)
        break
      }

      // Ignore unknown directives (host, noindex, etc.)
      default:
        break
    }
  }

  // Flush any remaining group
  flushGroup()

  // Derive AI crawler permissions from the parsed groups
  const aiCrawlerPermissions = deriveAiPermissions(groups)

  return {
    raw,
    groups,
    sitemapReferences: sitemapRefs,
    crawlDelays,
    aiCrawlerPermissions
  }

  function flushGroup() {
    if (currentAgents.length === 0 && currentRules.length > 0) {
      currentAgents = ['*']
    }
    if (currentAgents.length > 0) {
      for (const agent of currentAgents) {
        groups.push({
          userAgent: agent,
          rules: [...currentRules]
        })
      }
    }
    currentAgents = []
    currentRules = []
  }
}

/**
 * Determine the effective permission for each AI crawler.
 *
 * Resolution order (same as Google's spec):
 * 1. Look for a group matching the exact bot name (case-insensitive).
 * 2. Fall back to the wildcard (*) group.
 * 3. If no matching group exists → 'allowed' (open by default).
 *
 * Possible values: 'allowed' | 'blocked' | 'partially-blocked'
 */
function deriveAiPermissions(groups) {
  const result = {}

  for (const crawler of AI_CRAWLERS) {
    const specific = groups.find(
      g => g.userAgent.toLowerCase() === crawler.toLowerCase()
    )
    const wildcard = groups.find(g => g.userAgent === '*')

    const effectiveGroup = specific || wildcard

    if (!effectiveGroup || effectiveGroup.rules.length === 0) {
      result[crawler] = 'allowed'
      continue
    }

    const disallows = effectiveGroup.rules.filter(r => r.type === 'disallow')
    const allows = effectiveGroup.rules.filter(r => r.type === 'allow')

    // Disallow: / with no allows → fully blocked
    const blocksRoot = disallows.some(r => r.path === '/')

    if (blocksRoot && allows.length === 0) {
      result[crawler] = 'blocked'
    } else if (disallows.length > 0) {
      result[crawler] = 'partially-blocked'
    } else {
      result[crawler] = 'allowed'
    }
  }

  return result
}

/**
 * Check if a specific path is allowed for a given user-agent
 * based on the parsed robots groups.
 *
 * Implements longest-match-wins rule.
 */
export function isPathAllowed(groups, userAgent, path) {
  // Find the most specific matching group
  const specific = groups.find(
    g => g.userAgent.toLowerCase() === userAgent.toLowerCase()
  )
  const wildcard = groups.find(g => g.userAgent === '*')
  const group = specific || wildcard

  if (!group || group.rules.length === 0) return true

  // Find the longest matching rule
  let bestMatch = null
  let bestLength = -1

  for (const rule of group.rules) {
    if (pathMatches(path, rule.path) && rule.path.length > bestLength) {
      bestMatch = rule
      bestLength = rule.path.length
    }
  }

  if (!bestMatch) return true
  return bestMatch.type === 'allow'
}

/**
 * Simple robots.txt path matching.
 * Supports trailing * wildcard and $ end anchor.
 */
function pathMatches(actualPath, rulePath) {
  let pattern = rulePath

  // $ anchor at the end means exact match
  if (pattern.endsWith('$')) {
    pattern = pattern.slice(0, -1)
    return actualPath === pattern
  }

  // Trailing * is implicit anyway, but handle explicit *
  if (pattern.endsWith('*')) {
    pattern = pattern.slice(0, -1)
  }

  return actualPath.startsWith(pattern)
}
