/**
 * sitemapParser.js — Fetch and parse sitemap.xml and sitemap index files.
 *
 * Handles:
 *   - Standard sitemaps (<urlset>)
 *   - Sitemap index files (<sitemapindex>)
 *   - Nested sitemap indexes (up to 2 levels deep)
 *   - Gzipped sitemaps (.xml.gz) — marked but not decompressed
 *   - lastmod, changefreq, priority metadata per URL
 *
 * Uses fast-xml-parser which is already in project dependencies.
 */

import { XMLParser } from 'fast-xml-parser'
import { fetchText } from './fetchers.js'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['url', 'sitemap', 'xhtml:link'].includes(name)
})

/** Maximum number of child sitemaps to follow from a sitemap index. */
const MAX_CHILD_SITEMAPS = 50

/** Maximum total URLs we collect across all sitemaps. */
const MAX_URLS = 5000

/**
 * Discover and parse all sitemaps for a given origin.
 *
 * @param {string} origin — e.g. "https://example.com"
 * @param {string[]} robotsSitemapRefs — sitemap URLs declared in robots.txt
 * @returns {object} Parsed sitemap data
 */
export async function parseSitemaps(origin, robotsSitemapRefs = []) {
  // Candidate sitemap URLs: from robots.txt + standard locations
  const candidates = new Set([
    ...robotsSitemapRefs,
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`
  ])

  const discovered = []  // metadata about each discovered sitemap
  const allUrls = []      // all URLs found across all sitemaps
  const errors = []       // parsing errors
  const seen = new Set()  // avoid processing the same sitemap twice

  for (const sitemapUrl of candidates) {
    if (seen.has(sitemapUrl)) continue
    await processSitemap(sitemapUrl, 0)
  }

  return {
    discovered,
    totalUrls: allUrls.length,
    urls: allUrls,
    errors,
    health: {
      sitemapsFound: discovered.filter(s => s.ok).length,
      sitemapsFailed: discovered.filter(s => !s.ok).length,
      totalUrls: allUrls.length,
      urlsWithLastmod: allUrls.filter(u => u.lastmod).length,
      duplicateUrls: findDuplicates(allUrls.map(u => u.loc))
    }
  }

  async function processSitemap(url, depth) {
    if (seen.has(url) || depth > 2 || allUrls.length >= MAX_URLS) return
    seen.add(url)

    // Skip gzipped sitemaps for now — flag them
    if (url.endsWith('.gz')) {
      discovered.push({
        url,
        type: 'gzipped',
        ok: false,
        note: 'Gzipped sitemaps are detected but not decompressed.'
      })
      return
    }

    const res = await fetchText(url)

    if (!res.ok) {
      discovered.push({
        url,
        type: 'unknown',
        ok: false,
        status: res.status,
        error: res.error || `HTTP ${res.status}`
      })
      return
    }

    // Try to parse as XML
    let parsed
    try {
      parsed = parser.parse(res.body)
    } catch (parseErr) {
      discovered.push({
        url,
        type: 'invalid',
        ok: false,
        error: `XML parse error: ${parseErr.message}`
      })
      errors.push({ url, error: parseErr.message })
      return
    }

    // Case 1: Sitemap Index
    if (parsed.sitemapindex) {
      const children = normalizeArray(parsed.sitemapindex.sitemap)
      discovered.push({
        url,
        type: 'index',
        ok: true,
        childCount: children.length
      })

      const childUrls = children
        .map(s => s.loc)
        .filter(Boolean)
        .slice(0, MAX_CHILD_SITEMAPS)

      for (const childUrl of childUrls) {
        await processSitemap(childUrl, depth + 1)
      }
      return
    }

    // Case 2: Standard urlset
    if (parsed.urlset) {
      const urls = normalizeArray(parsed.urlset.url)
      discovered.push({
        url,
        type: 'urlset',
        ok: true,
        urlCount: urls.length
      })

      for (const entry of urls) {
        if (allUrls.length >= MAX_URLS) break

        const loc = typeof entry === 'string' ? entry : entry.loc
        if (!loc) continue

        // Extract hreflang links if present
        const hreflangLinks = normalizeArray(entry['xhtml:link'])
          .filter(l => l?.['@_rel'] === 'alternate' && l?.['@_hreflang'])
          .map(l => ({ lang: l['@_hreflang'], href: l['@_href'] }))

        allUrls.push({
          loc: loc,
          lastmod: entry.lastmod || null,
          changefreq: entry.changefreq || null,
          priority: entry.priority != null ? parseFloat(entry.priority) : null,
          source: url,
          hreflang: hreflangLinks.length > 0 ? hreflangLinks : null
        })
      }
      return
    }

    // Unknown XML structure
    discovered.push({
      url,
      type: 'unknown',
      ok: false,
      error: 'XML did not contain <urlset> or <sitemapindex>'
    })
  }
}

function normalizeArray(val) {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function findDuplicates(urls) {
  const counts = {}
  for (const u of urls) {
    const normalized = normalizeUrl(u)
    counts[normalized] = (counts[normalized] || 0) + 1
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([url, count]) => ({ url, count }))
}

function normalizeUrl(url) {
  try {
    const u = new URL(url)
    // Normalize: lowercase host, remove trailing slash, remove default port
    let path = u.pathname.replace(/\/+$/, '') || '/'
    return `${u.protocol}//${u.hostname}${path}${u.search}`
  } catch {
    return url
  }
}
