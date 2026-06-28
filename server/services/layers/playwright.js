import { chromium } from 'playwright'

export async function renderPage(url) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)
  const html = await page.content()
  const viewport = page.viewportSize()
  const screenshot = (await page.screenshot({ type: 'png' })).toString('base64')
  const fullPageScreenshot = (await page.screenshot({ type: 'png', fullPage: true })).toString('base64')
  const pageMetrics = await page.evaluate(() => ({
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    document: {
      width: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
      height: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0)
    }
  }))
  const title = await page.title()

  return {
    page,
    browser,
    html,
    screenshot,
    screenshots: {
      viewport: screenshot,
      fullPage: fullPageScreenshot
    },
    screenshotMeta: {
      viewport: pageMetrics.viewport || viewport,
      fullPage: pageMetrics.document
    },
    title
  }
}
