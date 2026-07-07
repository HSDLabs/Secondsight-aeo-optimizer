/**
 * fetchers.js — Low-level HTTP utilities for the crawler engine.
 *
 * Every function returns a normalized result object so the pipeline
 * never has to worry about fetch internals or error shapes.
 */

const FETCH_TIMEOUT = 15_000
const USER_AGENT = 'SecondSight-Crawler/1.0 (+https://secondsight.dev)'

/**
 * Fetch a text resource (robots.txt, sitemap XML) at a known URL.
 *
 * Returns { ok, status, body, url, redirected, headers, timing, error }
 */
export async function fetchText(url, opts = {}) {
  const timeout = opts.timeout ?? FETCH_TIMEOUT
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': opts.userAgent ?? USER_AGENT },
      redirect: 'follow'
    })

    const body = await res.text()
    const elapsed = Date.now() - start

    return {
      ok: res.ok,
      status: res.status,
      body,
      url: res.url,
      redirected: res.redirected,
      headers: Object.fromEntries(res.headers.entries()),
      timing: elapsed,
      error: null
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: '',
      url,
      redirected: false,
      headers: {},
      timing: Date.now() - start,
      error: err.name === 'AbortError' ? 'timeout' : err.message
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Probe a page URL with a HEAD request first (fast), falling back to
 * GET if HEAD is not supported or returns an unexpected status.
 *
 * Captures redirect chain, final URL, response time, status code,
 * and selected response headers (X-Robots-Tag, Link, Content-Type).
 *
 * Returns {
 *   url, finalUrl, status, timing, redirectChain,
 *   headers, error
 * }
 */
export async function probePage(url, opts = {}) {
  const timeout = opts.timeout ?? FETCH_TIMEOUT
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()

  // We need to track the redirect chain manually.
  // fetch() with redirect:'follow' doesn't expose intermediaries.
  // So we use redirect:'manual' and follow up to 10 hops.
  const chain = []
  let currentUrl = url
  let finalResponse = null
  const MAX_REDIRECTS = 10

  try {
    for (let i = 0; i < MAX_REDIRECTS; i++) {
      const res = await fetch(currentUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': opts.userAgent ?? USER_AGENT },
        redirect: 'manual'
      })

      const status = res.status

      if (status >= 300 && status < 400) {
        const location = res.headers.get('location')
        if (!location) {
          // Redirect without Location — treat as final
          finalResponse = res
          break
        }
        const nextUrl = new URL(location, currentUrl).href
        chain.push({ url: currentUrl, status, location: nextUrl })
        currentUrl = nextUrl
        continue
      }

      // If HEAD returns 405 Method Not Allowed, retry with GET
      if (status === 405) {
        const getRes = await fetch(currentUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': opts.userAgent ?? USER_AGENT },
          redirect: 'manual'
        })
        finalResponse = getRes
        break
      }

      finalResponse = res
      break
    }

    // If we exhausted redirect hops, that's a loop
    if (!finalResponse) {
      return {
        url,
        finalUrl: currentUrl,
        status: 0,
        timing: Date.now() - start,
        redirectChain: chain,
        headers: {},
        error: 'redirect-loop'
      }
    }

    const elapsed = Date.now() - start
    const headers = Object.fromEntries(finalResponse.headers.entries())

    return {
      url,
      finalUrl: currentUrl,
      status: finalResponse.status,
      timing: elapsed,
      redirectChain: chain,
      headers,
      error: null
    }
  } catch (err) {
    return {
      url,
      finalUrl: currentUrl,
      status: 0,
      timing: Date.now() - start,
      redirectChain: chain,
      headers: {},
      error: err.name === 'AbortError' ? 'timeout' : err.message
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch a page via GET and return the HTML body along with probe data.
 * Used for extracting meta robots, canonicals, hreflang from HTML.
 */
export async function fetchPage(url, opts = {}) {
  const timeout = opts.timeout ?? FETCH_TIMEOUT
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': opts.userAgent ?? USER_AGENT },
      redirect: 'follow'
    })

    const body = await res.text()
    const elapsed = Date.now() - start

    return {
      ok: res.ok,
      status: res.status,
      body,
      url: res.url,
      redirected: res.redirected,
      headers: Object.fromEntries(res.headers.entries()),
      timing: elapsed,
      error: null
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: '',
      url,
      redirected: false,
      headers: {},
      timing: Date.now() - start,
      error: err.name === 'AbortError' ? 'timeout' : err.message
    }
  } finally {
    clearTimeout(timer)
  }
}
