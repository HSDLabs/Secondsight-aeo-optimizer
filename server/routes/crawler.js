/* global Buffer, process */
import { Router } from 'express'
import { analyzeCrawler } from '../services/crawler/index.js'

const router = Router()

router.post('/', async (req, res) => {
  // Fallback manual body parser if middleware was bypassed or Content-Type is missing
  if (!req.body || Object.keys(req.body).length === 0) {
    try {
      const buffers = []
      for await (const chunk of req) {
        buffers.push(chunk)
      }
      const rawBody = Buffer.concat(buffers).toString()
      if (rawBody) {
        req.body = JSON.parse(rawBody)
      }
    } catch (err) {
      console.warn('[crawler-route] Manual body parse failed:', err.message)
    }
  }

  console.log('[crawler-route] Content-Type:', req.headers['content-type'])
  console.log('[crawler-route] req.body:', req.body)

  const url = req.body?.url
  if (!url) return res.status(400).json({ error: 'URL required. Send JSON body: { "url": "https://example.com" }' })

  try {
    const result = await analyzeCrawler(url)
    res.json(result)
  } catch (err) {
    console.error('[crawler]', err)
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    })
  }
})

export default router
