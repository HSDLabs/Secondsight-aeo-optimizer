export async function extractAccessibility(page) {
  const issues = []

  function flattenNodes(nodes) {
    return nodes.reduce((acc, node) => {
      if (!node) return acc

      if (Array.isArray(node)) {
        acc.push(...flattenNodes(node))
        return acc
      }

      acc.push(node)
      return acc
    }, [])
  }

  function getAccessibleName(element) {
    const ariaLabel = element.getAttribute('aria-label')?.trim()
    if (ariaLabel) return ariaLabel

    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const label = labelledBy
        .split(/\s+/)
        .map(id => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(' ')

      if (label) return label
    }

    const alt = element.getAttribute('alt')?.trim()
    if (alt) return alt

    const title = element.getAttribute('title')?.trim()
    if (title) return title

    return (
      element.innerText?.trim() ||
      element.textContent?.trim() ||
      ''
    ).slice(0, 60)
  }

  // Images missing alt text
  const imgIssues = await page.$$eval('img', imgs =>
    imgs
      .filter(img => !img.alt || img.alt.trim() === '')
      .map(img => ({
        type: 'Missing alt text',
        element: img.outerHTML.slice(0, 80),
        severity: 'critical'
      }))
  )

  // Buttons without accessible names
  const btnIssues = await page.$$eval('button', btns =>
    btns
      .filter(btn => {
        const text = btn.innerText?.trim()
        const aria = btn.getAttribute('aria-label')
        const hasSvg = btn.querySelector('svg')
        const hasImg = btn.querySelector('img')

        return !text && !aria && !hasSvg && !hasImg
      })
      .map(btn => ({
        type: 'Unlabeled button',
        element: btn.outerHTML.slice(0, 80),
        severity: 'critical'
      }))
  )

  // Links without accessible names
  const linkIssues = await page.$$eval('a', links =>
    links
      .filter(link => {
        const text = link.innerText?.trim()
        const aria = link.getAttribute('aria-label')
        const hasSvg = link.querySelector('svg')
        const hasImg = link.querySelector('img')

        return !text && !aria && !hasSvg && !hasImg
      })
      .map(link => ({
        type: 'Empty link',
        element: link.outerHTML.slice(0, 80),
        severity: 'warning'
      }))
  )

  // Inputs without labels
  const inputIssues = await page.$$eval(
    'input:not([type="hidden"])',
    inputs =>
      inputs
        .filter(input => {
          const aria = input.getAttribute('aria-label')

          const hasLabel =
            input.id &&
            document.querySelector(`label[for="${input.id}"]`)

          return !aria && !hasLabel
        })
        .map(input => ({
          type: 'Unlabeled input',
          element: input.outerHTML.slice(0, 80),
          severity: 'critical'
        }))
  )

  // H1 checks
  const h1Count = await page.$$eval('h1', els => els.length)

  if (h1Count === 0) {
    issues.push({
      type: 'Missing H1',
      element: 'page',
      severity: 'critical'
    })
  }

  if (h1Count > 1) {
    issues.push({
      type: `Multiple H1s (${h1Count})`,
      element: 'page',
      severity: 'warning'
    })
  }

  issues.push(
    ...imgIssues,
    ...btnIssues,
    ...linkIssues,
    ...inputIssues
  )

  // Semantic Tree
  const snapshot = await page.evaluate(() => {
    const importantTags = [
      'header',
      'nav',
      'main',
      'section',
      'article',
      'footer',
      'h1',
      'h2',
      'h3',
      'button',
      'a',
      'img',
      'form',
      'input'
    ]

    function flattenNodes(nodes) {
      return nodes.reduce((acc, node) => {
        if (!node) return acc

        if (Array.isArray(node)) {
          acc.push(...flattenNodes(node))
          return acc
        }

        acc.push(node)
        return acc
      }, [])
    }

    function getAccessibleName(element) {
      const ariaLabel = element.getAttribute('aria-label')?.trim()
      if (ariaLabel) return ariaLabel

      const labelledBy = element.getAttribute('aria-labelledby')
      if (labelledBy) {
        const label = labelledBy
          .split(/\s+/)
          .map(id => document.getElementById(id)?.textContent?.trim())
          .filter(Boolean)
          .join(' ')

        if (label) return label
      }

      const alt = element.getAttribute('alt')?.trim()
      if (alt) return alt

      const title = element.getAttribute('title')?.trim()
      if (title) return title

      return (
        element.innerText?.trim() ||
        element.textContent?.trim() ||
        ''
      ).slice(0, 60)
    }

    function buildTree(element, depth = 0) {
      if (!element || depth > 4) return null

      const tag = element.tagName.toLowerCase()

      const isImportant =
        importantTags.includes(tag) ||
        element.getAttribute('role')

      if (!isImportant) {
        return flattenNodes(
          [...element.children].map(child => buildTree(child, depth))
        ).filter(Boolean)
      }

      const name = getAccessibleName(element)

      const children = flattenNodes(
        [...element.children].map(child => buildTree(child, depth + 1))
      )
        .filter(Boolean)
        .slice(0, 8)

      return {
        role: element.getAttribute('role') || tag,
        name,
        children
      }
    }

    return {
      role: 'document',
      name: document.title || '',
      children: flattenNodes(
        [...document.body.children].map(child => buildTree(child, 1))
      )
        .filter(Boolean)
        .slice(0, 12)
    }
  })

  return {
    snapshot,
    issues
  }
}