import { chromium } from 'playwright'

export async function renderPage(url) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const html = await page.content()
  const screenshot = (await page.screenshot({ type: 'png' })).toString('base64')
  const title = await page.title()
  return { page, browser, html, screenshot, title }
}
