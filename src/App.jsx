import { useState } from 'react'
import './styles/App.css'
import './styles/VisibilityLayer.css'
import URLInput from './components/URLInput'
import PageOverview from './components/PageOverview'
import IssuesArea from './components/IssuesArea'
import ScoresPanel from './components/panels/ScoresPanel'
import VisibilityLayer from './components/panels/VisibilityLayer'

function calculateVisibilityBreakdown(data) {
  if (!data) {
    return {
      score: 0,
      items: []
    }
  }

  const wordCount = data.readable?.wordCount ?? 0
  const issues = data.a11y?.issues || []
  const structureCount = data.a11y?.snapshot?.children?.length ?? 0
  const semanticNodeCount = Object.keys(data.a11y?.semanticIndex || {}).length

  const structure = Math.min(20, structureCount * 3 + Math.min(8, Math.round(semanticNodeCount / 15)))

  const criticalIssues = issues.filter(issue => issue.severity === 'critical')
  const warningIssues = issues.filter(issue => issue.severity === 'warning')
  const criticalPenalty = criticalIssues.length > 0
    ? 4 + Math.min(8, (criticalIssues.length - 1) * 2)
    : 0
  const warningPenalty = warningIssues.length > 0
    ? 2 + Math.min(4, warningIssues.length - 1)
    : 0
  const accessibility = -Math.min(16, criticalPenalty + warningPenalty)

  const contentDepth = wordCount >= 800 ? 20
    : wordCount >= 500 ? 16
    : wordCount >= 250 ? 10
    : wordCount >= 100 ? 4
    : -8

  const extractability = data.readable?.markdown ? 12 : -6

  const h1Issues = issues.filter(issue => issue.type === 'Missing H1' || issue.type?.startsWith('Multiple H1'))
  const headingBonus = h1Issues.length === 0 ? 8 : 0

  const base = 40
  const score = Math.max(0, Math.min(100, base + structure + accessibility + contentDepth + extractability + headingBonus))

  return {
    score,
    items: [
      { label: 'Base', value: base },
      { label: 'Structure', value: structure },
      { label: 'Accessibility', value: accessibility },
      { label: 'Content Depth', value: contentDepth },
      { label: 'Extractability', value: extractability },
      { label: 'Heading Structure', value: headingBonus > 0 ? headingBonus : -(h1Issues.length * 3) }
    ],
    placeholders: [
      'Crawler Access',
      'Entity Understanding',
      'Retrieval Readiness',
      'Citation Readiness'
    ]
  }
}

export default function App() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  async function analyze() {
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setSelectedIssue(null)
    setSelectedNodeId(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setSelectedNodeId(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const issueCount = data?.a11y?.issues?.length ?? 0
  const scoreBreakdown = calculateVisibilityBreakdown(data)
  const visibilityScore = scoreBreakdown.score
  const selectedNode = selectedNodeId ? data?.a11y?.semanticIndex?.[selectedNodeId] : null

  function selectIssueGroup(type) {
    setSelectedIssue(type)

    const linkedNodeId = data?.a11y?.issues
      ?.filter(issue => issue.type === type)
      .flatMap(issue => issue.nodeIds || [])
      .find(Boolean)

    if (linkedNodeId) setSelectedNodeId(linkedNodeId)
  }

  return (
    <main className="app-shell">
      <div className="app-header">
        <div>
          <p className="eyebrow">SecondSight</p>
          <h1>Compare human, machine, and LLM views of a page.</h1>
        </div>
        <URLInput
          value={url}
          onChange={setUrl}
          onAnalyze={analyze}
          loading={loading}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!data && !loading && !error && (
        <section className="empty-hero">
          <h2>Start with a public URL.</h2>
          <p>
            SecondSight will capture the visual page, extract semantic structure,
            surface LLM-readable content, and separate visibility issues from the tree.
          </p>
        </section>
      )}

      {loading && (
        <section className="empty-hero loading-state">
          <h2>Analyzing page...</h2>
          <p>Capturing the browser view, semantic structure, readable text, and accessibility signals.</p>
        </section>
      )}

      {data && !loading && (
        <>
          <PageOverview
            data={data}
            score={visibilityScore}
            issueCount={issueCount}
            scoreBreakdown={scoreBreakdown}
          />

          <VisibilityLayer
            data={data}
            score={visibilityScore}
            scoreBreakdown={scoreBreakdown}
            selectedNode={selectedNode}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            screenshotMeta={data.screenshotMeta}
          />

          <ScoresPanel
            data={data}
            score={visibilityScore}
            issueCount={issueCount}
            scoreBreakdown={scoreBreakdown}
          />
          <IssuesArea
            issues={data.a11y?.issues}
            semanticIndex={data.a11y?.semanticIndex}
            selectedIssue={selectedIssue}
            selectedNodeId={selectedNodeId}
            onSelectIssue={selectIssueGroup}
            onSelectNode={setSelectedNodeId}
          />
        </>
      )}
    </main>
  )
}
