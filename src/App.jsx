import { useState } from 'react'
import './styles/App.css'
import URLInput from './components/URLInput'
import PageOverview from './components/PageOverview'
import IssuesArea from './components/IssuesArea'
import ScoresPanel from './components/panels/ScoresPanel'
import HumanViewPanel from './components/panels/HumanViewPanel'
import A11yPanel from './components/panels/A11yPanel'
import LLMTextPanel from './components/panels/LLMTextPanel'

function calculateVisibilityScore(data) {
  if (!data) return 0

  const wordCount = data.readable?.wordCount ?? 0
  const issueCount = data.a11y?.issues?.length ?? 0
  const structureCount = data.a11y?.snapshot?.children?.length ?? 0

  const contentScore = Math.min(35, Math.round((wordCount / 700) * 35))
  const structureScore = Math.min(35, structureCount * 6)
  const issuePenalty = Math.min(35, issueCount * 5)

  return Math.max(0, Math.min(100, 30 + contentScore + structureScore - issuePenalty))
}

export default function App() {
  const [url, setUrl] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedIssue, setSelectedIssue] = useState(null)

  async function analyze() {
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setSelectedIssue(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const issueCount = data?.a11y?.issues?.length ?? 0
  const visibilityScore = calculateVisibilityScore(data)

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
          <PageOverview data={data} score={visibilityScore} issueCount={issueCount} />

          <div className="comparison-grid">
            <HumanViewPanel screenshot={data.screenshot} />
            <A11yPanel snapshot={data.a11y?.snapshot} />
            <LLMTextPanel readable={data.readable} />
          </div>

          <ScoresPanel data={data} score={visibilityScore} issueCount={issueCount} />
          <IssuesArea
            issues={data.a11y?.issues}
            selectedIssue={selectedIssue}
            onSelectIssue={setSelectedIssue}
          />
        </>
      )}
    </main>
  )
}
