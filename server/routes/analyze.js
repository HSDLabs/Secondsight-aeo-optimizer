import { Router } from 'express'
import { renderPage } from '../services/layers/playwright.js'
import { extractAccessibility } from '../services/layers/accessibility.js'
import { extractReadable } from '../services/layers/readability.js'

const router = Router()

router.post('/', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL required' })

  let browser
  try {
    const { page, browser: b, html, screenshot, title } = await renderPage(url)
    browser = b
    const [a11y, readable] = await Promise.all([
      extractAccessibility(page),
      Promise.resolve(extractReadable(html, url))
    ])
    await browser.close()

    res.json({ url, title, screenshot, a11y, readable })
  } catch (err) {
  console.error(err)

  await browser?.close()

  res.status(500).json({
    error: err.message,
    stack: err.stack
  })
}
})

export default router