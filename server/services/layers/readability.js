import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import TurndownService from 'turndown'

export function extractReadable(html, url) {
  const dom = new JSDOM(html, { url })
  const article = new Readability(dom.window.document).parse()
  const markdown = article ? new TurndownService().turndown(article.content) : ''
  return {
    title: article?.title || '',
    excerpt: article?.excerpt || '',
    markdown,
    wordCount: markdown.split(/\s+/).filter(Boolean).length
  }
}