import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import '../../styles/CrawlerAccess.css'

import { AI_CRAWLERS, getBotStatusLabel } from './crawlerUtils'
import CrawlerHealthOverview from './CrawlerHealthOverview'
import CrawlerPermissions from './CrawlerPermissions'
import RobotsViewer from './RobotsViewer'
import SitemapExplorer from './SitemapExplorer'
import DiscoveryGraph from './DiscoveryGraph'
import CrawlerIssues from './CrawlerIssues'

export default function CrawlerAccess() {
  const { data: mainData, loading: mainLoading, error: mainError } = useOutletContext()
  
  // Crawler-specific state
  const [crawlerData, setCrawlerData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // UI Interactive States
  const [expandedSitemaps, setExpandedSitemaps] = useState({})
  const [sitemapsPageSize, setSitemapsPageSize] = useState({})
  const [expandedIssues, setExpandedIssues] = useState({})
  const [activeGraphNode, setActiveGraphNode] = useState(null)

  // 1. Fetch crawler data when main URL changes or completes analysis
  useEffect(() => {
    if (!mainData?.url) {
      queueMicrotask(() => {
        setCrawlerData(null)
      })
      return
    }

    let isMounted = true
    
    async function fetchCrawlerAnalysis() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/crawler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: mainData.url })
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || `Server responded with status ${res.status}`)
        }
        if (isMounted) {
          setCrawlerData(json)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCrawlerAnalysis()

    return () => {
      isMounted = false
    }
  }, [mainData?.url])

  const issues = useMemo(() => crawlerData?.issues || [], [crawlerData?.issues])

  // ── Action Queue Issues (sorted by impact severity) ──
  const sortedIssues = useMemo(() => {
    const severityWeights = { critical: 3, warning: 2, info: 1 }
    return [...issues].sort((a, b) => {
      const weightA = severityWeights[a.severity] || 0
      const weightB = severityWeights[b.severity] || 0
      return weightB - weightA
    })
  }, [issues])

  // Handle Loading/Empty States
  if (mainLoading) {
    return (
      <div className="crawler-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
        <div className="skeleton-box" style={{ height: '160px', width: '100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="skeleton-box" style={{ height: '380px' }} />
          <div className="skeleton-box" style={{ height: '380px', gridColumn: 'span 2' }} />
        </div>
        <div className="skeleton-box" style={{ height: '240px', width: '100%' }} />
      </div>
    )
  }

  if (mainError) {
    return (
      <div className="error-banner">
        <h4>Analysis Failed</h4>
        <p>{mainError}</p>
      </div>
    )
  }

  if (!mainData) {
    return (
      <section className="empty-hero">
        <div className="empty-hero-content">
          <div className="empty-hero-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h2>Analyze a URL to check Crawler Access.</h2>
          <p>We will probe robots.txt, trace sitemaps, construct your crawl graph, and diagnose visibility issues for AI search agents.</p>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <div className="crawler-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
        <div className="skeleton-box" style={{ height: '160px', width: '100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="skeleton-box" style={{ height: '380px' }} />
          <div className="skeleton-box" style={{ height: '380px', gridColumn: 'span 2' }} />
        </div>
        <div className="skeleton-box" style={{ height: '240px', width: '100%' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-banner">
        <h4>Crawler Diagnostics Error</h4>
        <p>{error}</p>
      </div>
    )
  }

  if (!crawlerData) return null

  // Destructure crawler result
  const {
    origin,
    robots,
    sitemaps,
    score
  } = crawlerData

  // Summary Metrics calculations
  const botsAllowedCount = AI_CRAWLERS.filter(bot => getBotStatusLabel(robots, bot.ua) === 'Allowed').length
  const botsLimitedCount = AI_CRAWLERS.filter(bot => getBotStatusLabel(robots, bot.ua) === 'Limited').length
  const botsBlockedCount = AI_CRAWLERS.filter(bot => getBotStatusLabel(robots, bot.ua) === 'Blocked').length

  const sitemapsData = sitemaps?.discovered || []
  const totalSitemapsCount = sitemapsData.length
  const parsedSitemapsCount = sitemapsData.filter(s => s.ok).length
  const criticalIssuesCount = issues.filter(i => i.severity === 'critical').length

  // Toggle Sitemap Node Expanded
  const toggleSitemap = (sUrl) => {
    setExpandedSitemaps(prev => ({
      ...prev,
      [sUrl]: !prev[sUrl]
    }))
  }

  // Increase Page size for Sitemap Node
  const loadMoreSitemapUrls = (sUrl, totalCount) => {
    setSitemapsPageSize(prev => ({
      ...prev,
      [sUrl]: Math.min(totalCount, (prev[sUrl] || 15) + 30)
    }))
  }

  return (
    <div className="crawler-access-page">
      
      {/* 1. Crawler Health Overview */}
      <CrawlerHealthOverview
        score={score}
        botsAllowedCount={botsAllowedCount}
        botsBlockedCount={botsBlockedCount}
        botsLimitedCount={botsLimitedCount}
        sitemaps={sitemaps}
        parsedSitemapsCount={parsedSitemapsCount}
        totalSitemapsCount={totalSitemapsCount}
        criticalIssuesCount={criticalIssuesCount}
      />

      {/* 2. Crawler Access List */}
      <CrawlerPermissions
        robots={robots}
      />

      {/* 3. robots.txt Interactive Viewer */}
      <RobotsViewer
        robots={robots}
        sitemaps={sitemaps}
      />

      {/* 4. Sitemap Explorer */}
      <SitemapExplorer
        sitemaps={sitemaps}
        origin={origin}
        issues={issues}
        expandedSitemaps={expandedSitemaps}
        sitemapsPageSize={sitemapsPageSize}
        toggleSitemap={toggleSitemap}
        loadMoreSitemapUrls={loadMoreSitemapUrls}
      />

      {/* 5. Discovery Graph */}
      <DiscoveryGraph
        crawlerData={crawlerData}
        activeGraphNode={activeGraphNode}
        setActiveGraphNode={setActiveGraphNode}
      />

      {/* 6. Crawler Issues Accordion (Action Queue) */}
      <CrawlerIssues
        sortedIssues={sortedIssues}
        expandedIssues={expandedIssues}
        setExpandedIssues={setExpandedIssues}
      />
      
    </div>
  )
}
