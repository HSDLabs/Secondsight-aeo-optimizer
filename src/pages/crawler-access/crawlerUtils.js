// Well-known AI crawlers we track (matches backend)
export const AI_CRAWLERS = [
  { name: 'Googlebot', ua: 'Googlebot', desc: "Google's primary search crawler.", avatarClass: 'google', letter: 'G' },
  { name: 'GPTBot', ua: 'GPTBot', desc: "OpenAI's crawler for training data.", avatarClass: 'openai', letter: 'O' },
  { name: 'ClaudeBot', ua: 'ClaudeBot', desc: "Anthropic's crawler for Claude models.", avatarClass: 'anthropic', letter: 'A' },
  { name: 'PerplexityBot', ua: 'PerplexityBot', desc: "Perplexity AI's search and citation crawler.", avatarClass: '', letter: 'P' },
  { name: 'Bytespider', ua: 'Bytespider', desc: "ByteDance's AI and search index crawler.", avatarClass: '', letter: 'B' },
  { name: 'Applebot', ua: 'Applebot', desc: "Apple's search and Siri intelligence crawler.", avatarClass: '', letter: 'A' },
  { name: 'Bingbot', ua: 'Bingbot', desc: "Microsoft Bing's web indexing crawler.", avatarClass: '', letter: 'B' },
  { name: 'Google-Extended', ua: 'Google-Extended', desc: "Google's token to opt-out of Gemini training.", avatarClass: 'google', letter: 'G' },
  { name: 'ChatGPT-User', ua: 'ChatGPT-User', desc: "OpenAI's user-initiated crawler.", avatarClass: 'openai', letter: 'C' },
  { name: 'CCBot', ua: 'CCBot', desc: "Common Crawl's open-web scraper.", avatarClass: '', letter: 'C' }
]

// Get Severity Score Tone
export const getScoreTone = (val) => {
  if (val >= 80) return 'good'
  if (val >= 55) return 'warning'
  return 'poor'
}

// Get status label from bots permissions
export function getBotStatusLabel(robots, botUa) {
  const status = robots.aiCrawlerPermissions[botUa] || robots.aiCrawlerPermissions['*'] || 'allowed'
  if (status === 'blocked') return 'Blocked'
  if (status === 'partially-blocked') return 'Limited'
  return 'Allowed'
}

// Get bot rules matching raw rules
export function getBotRulesContent(robots, botUa) {
  const specificGroup = robots.rules.find(g => g.userAgent.toLowerCase() === botUa.toLowerCase())
  const wildcardGroup = robots.rules.find(g => g.userAgent === '*')
  const group = specificGroup || wildcardGroup
  
  if (!group || group.rules.length === 0) {
    return `User-agent: ${botUa}\n# No specific rules defined (Inherited: Allowed)`
  }
  
  let text = `User-agent: ${group.userAgent}\n`
  group.rules.forEach(r => {
    text += `${r.type === 'allow' ? 'Allow' : 'Disallow'}: ${r.path}\n`
  })
  
  if (robots.crawlDelays[group.userAgent]) {
    text += `Crawl-delay: ${robots.crawlDelays[group.userAgent]}\n`
  }
  
  if (specificGroup) {
    text += `# Resolved specifically for ${botUa}`
  } else {
    text += `# Inherited from wildcard (*) rules`
  }
  
  return text
}

// Group sitemaps for sitemap tree explorer
export function buildSitemapTree(sitemaps) {
  const sitemapTree = []
  const sitemapsData = sitemaps?.discovered || []
  const indices = sitemapsData.filter(s => s.type === 'index')
  const urlsets = sitemapsData.filter(s => s.type === 'urlset')
  const others = sitemapsData.filter(s => s.type !== 'index' && s.type !== 'urlset')

  if (indices.length > 0) {
    indices.forEach(idx => {
      sitemapTree.push({
        ...idx,
        children: urlsets
      })
    })
    sitemapTree.push(...others)
  } else {
    sitemapTree.push(...urlsets, ...others)
  }
  return sitemapTree
}

// Lookup URL probed details
export function getProbedDetails(pages, issues, locUrl) {
  const probed = pages?.probed?.find(p => p.url === locUrl)
  const signals = pages?.pageSignals?.find(ps => ps.url === locUrl)
  
  // Check if blocked by robots
  const isBlocked = issues?.some(i => i.type === 'blocked-in-sitemap' && i.affectedUrls?.includes(locUrl))
  
  return {
    status: probed?.status || 200,
    timing: probed?.timing || 0,
    noindex: signals?.noindex || false,
    blocked: isBlocked,
    error: probed?.error
  }
}

// Construct discovery path segments tree
export function buildDiscoveryGraph(crawlerData) {
  if (!crawlerData) {
    return { graphNodes: [], graphLinks: [], canvasWidth: 0, canvasHeight: 0, nodeMap: new Map() }
  }

  const { url: targetUrl, origin, sitemaps, pages, issues } = crawlerData

  const probedDetailsGetter = (locUrl) => getProbedDetails(pages, issues, locUrl)

  const pathTree = {
    name: 'Home',
    path: '/',
    url: origin || '/',
    children: {},
    type: 'homepage',
    ...probedDetailsGetter(origin || targetUrl)
  }

  const sitemapUrlsList = sitemaps?.urls || []
  const blockedUrlsSet = new Set(
    issues
      .filter(i => i.type === 'blocked-in-sitemap' || i.type === 'robots-blocks-all')
      .flatMap(i => i.affectedUrls || [])
  )

  sitemapUrlsList.forEach(u => {
    try {
      const parsed = new URL(u.loc)
      const pathname = parsed.pathname
      if (pathname === '/' || pathname === '') return
      
      const segments = pathname.split('/').filter(Boolean)
      let current = pathTree
      
      segments.forEach((seg, idx) => {
        const isLast = idx === segments.length - 1
        const nodePath = '/' + segments.slice(0, idx + 1).join('/')
        
        if (!current.children[seg]) {
          current.children[seg] = {
            name: seg,
            path: nodePath,
            url: isLast ? u.loc : '',
            children: {},
            type: isLast ? (segments.length > 1 ? 'page' : 'category') : 'category',
            status: 200,
            noindex: false,
            blocked: false,
            inSitemap: true
          }
        }
        
        if (isLast) {
          const details = probedDetailsGetter(u.loc)
          current.children[seg].url = u.loc
          current.children[seg].status = details.status
          current.children[seg].noindex = details.noindex
          current.children[seg].blocked = details.blocked || blockedUrlsSet.has(u.loc)
          current.children[seg].inSitemap = true
        }
        
        current = current.children[seg]
      })
    } catch {
      // ignore parsing errors
    }
  })

  // Group and flatten tree nodes for the visual SVG graph
  const maxNodeChildren = 3
  const graphNodes = []
  const graphLinks = []

  function traverseAndFlatten(currentNode, parentNode, currentDepth) {
    const nodeObj = {
      id: currentNode.path,
      name: currentNode.name,
      path: currentNode.path,
      type: currentNode.type,
      url: currentNode.url,
      status: currentNode.status,
      noindex: currentNode.noindex,
      blocked: currentNode.blocked,
      inSitemap: currentNode.inSitemap || false,
      depth: currentDepth
    }
    graphNodes.push(nodeObj)

    if (parentNode) {
      graphLinks.push({
        source: parentNode.path,
        target: currentNode.path
      })
    }

    const childKeys = Object.keys(currentNode.children)
    if (childKeys.length > 0) {
      const sortedKeys = childKeys.sort((a, b) => {
        const typeA = currentNode.children[a].type
        const typeB = currentNode.children[b].type
        if (typeA === 'category' && typeB !== 'category') return -1
        if (typeA !== 'category' && typeB === 'category') return 1
        return a.localeCompare(b)
      })

      const showKeys = sortedKeys.slice(0, maxNodeChildren)
      const remainingCount = sortedKeys.length - maxNodeChildren

      showKeys.forEach(key => {
        traverseAndFlatten(currentNode.children[key], nodeObj, currentDepth + 1)
      })

      if (remainingCount > 0) {
        const dummyNode = {
          name: `+ ${remainingCount} pages`,
          path: `${currentNode.path}/_more`,
          url: '',
          children: {},
          type: 'more_indicator',
          status: 200,
          noindex: false,
          blocked: false,
          inSitemap: true
        }
        traverseAndFlatten(dummyNode, nodeObj, currentDepth + 1)
      }
    }
  }

  traverseAndFlatten(pathTree, null, 0)

  const nodeMap = new Map(graphNodes.map(n => [n.path, n]))
  let leafCount = 0
  
  function assignCoordinates(nodePath, depth) {
    const node = nodeMap.get(nodePath)
    if (!node) return

    node.x = depth * 220 + 80

    const children = graphLinks
      .filter(l => l.source === nodePath)
      .map(l => nodeMap.get(l.target))
      .filter(Boolean)

    if (children.length === 0) {
      node.y = leafCount * 56 + 40
      leafCount++
    } else {
      children.forEach(child => {
        assignCoordinates(child.path, depth + 1)
      })
      const firstY = children[0].y
      const lastY = children[children.length - 1].y
      node.y = (firstY + lastY) / 2
    }
  }

  if (graphNodes.length > 0) {
    assignCoordinates(graphNodes[0].path, 0)
  }

  const canvasHeight = Math.max(320, leafCount * 56 + 30)
  const canvasWidth = Math.max(760, (Math.max(...graphNodes.map(n => n.depth)) + 1) * 220 + 100)

  return {
    graphNodes,
    graphLinks,
    canvasHeight,
    canvasWidth,
    nodeMap
  }
}

// Robots.txt syntax warnings
export function getRobotsWarnings(robots, sitemaps) {
  const rawRobotsLines = robots.raw ? robots.raw.split(/\r?\n/) : []
  const warningsByLine = {}
  let currentGroupAgent = ''

  rawRobotsLines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.toLowerCase().startsWith('user-agent:')) {
      currentGroupAgent = trimmed.slice(trimmed.indexOf(':') + 1).trim()
    } else if (trimmed.toLowerCase().startsWith('disallow:')) {
      const val = trimmed.slice(trimmed.indexOf(':') + 1).trim()
      if (val === '/') {
        if (currentGroupAgent === '*') {
          warningsByLine[idx] = {
            severity: 'critical',
            message: 'Wildcard block (Disallow: /) stops ALL search engines and AI crawlers.'
          }
        } else if (AI_CRAWLERS.some(bot => bot.name.toLowerCase() === currentGroupAgent.toLowerCase())) {
          warningsByLine[idx] = {
            severity: 'critical',
            message: `Completely blocks AI Agent: "${currentGroupAgent}" from scanning site contents.`
          }
        }
      }
    } else if (trimmed.toLowerCase().startsWith('crawl-delay:')) {
      const val = parseFloat(trimmed.slice(trimmed.indexOf(':') + 1).trim())
      if (val >= 10) {
        warningsByLine[idx] = {
          severity: 'warning',
          message: `Crawl-delay (${val}s) is very high. It will severely slow indexing rates.`
        }
      }
    } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
      const val = trimmed.slice(trimmed.indexOf(':') + 1).trim()
      const matchedErr = sitemaps?.errors?.find(e => e.url === val)
      if (matchedErr) {
        warningsByLine[idx] = {
          severity: 'critical',
          message: `Linked Sitemap failed to parse: ${matchedErr.error}`
        }
      }
    }
  })

  return warningsByLine
}
