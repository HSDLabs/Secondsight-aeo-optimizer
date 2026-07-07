import { useEffect, useRef, useState, useMemo } from 'react'
import TreeNode from './TreeNode'
import { getScoreVerdict } from './progressiveAnalysis'

/**
 * VisibilityLayer – The polished "Layer 1 – Visibility Overview"
 *
 * A single, viewport-height section that combines:
 * 1. Human View   – Flat website preview card
 * 2. Accessibility Tree – High-level landmarks with child counts
 * 3. Readable Content – Extraction stats & overview
 * 4. AI Visibility Score – Animated donut gauge
 */

export default function VisibilityLayer({
  data,
  score,
  scoreBreakdown,
  selectedNodeId,
  onSelectNode,
  screenshotMeta,
  focusPanel,
  loading = false
}) {
  const [showTreeModal, setShowTreeModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)

  if (!data) {
    if (!loading) return null

    return (
      <section className="visibility-layer loading-visibility-layer" aria-labelledby="layer-1-title">
        <div className="layer-header">
          <p className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', color: 'var(--muted)' }}>
            Layer 1: Evidence First
          </p>
          <p className="layer-subtitle" style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Raw signals AI systems see before reaching any conclusion.
          </p>
        </div>

        <div className="layer-grid">
          <LoadingLayerCard title="Human View" eyebrow="What users see" />
          <LoadingLayerCard title="Accessibility Tree" eyebrow="What browsers & assistive tech see" />
          <LoadingLayerCard title="Readable Content" eyebrow="What LLMs can extract" />
          <LoadingScoreCard />
        </div>
      </section>
    )
  }

  const screenshot = data.screenshots?.viewport || data.screenshot
  const fullPageScreenshot = data.screenshots?.fullPage
  const snapshot = data.a11y?.snapshot
  const readable = data.readable

  // Tree modal path calculation
  const selectedPath = findNodePath(snapshot, selectedNodeId)

  return (
    <section className="visibility-layer" aria-labelledby="layer-1-title">
      <div className="layer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
        <div>
          <p className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
            Layer 1: Evidence First
          </p>
          <p className="layer-subtitle" style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Raw signals AI systems see before reaching any conclusion.
          </p>
        </div>
      </div>

      <div className="layer-grid">
        <HumanViewCompact
          screenshot={screenshot}
          fullPageScreenshot={fullPageScreenshot}
          screenshotMeta={screenshotMeta}
          isFocused={focusPanel === 'human'}
        />

        <MachineStructureCompact
          snapshot={snapshot}
          isFocused={focusPanel === 'structure'}
          onViewTree={() => setShowTreeModal(true)}
        />

        <LLMExtractionCompact
          readable={readable}
          snapshot={snapshot}
          isFocused={focusPanel === 'llm'}
          onViewContent={() => setShowContentModal(true)}
        />

        <ScoreGauge
          score={score}
          isFocused={focusPanel === 'score'}
          onViewScoreBreakdown={() => setShowScoreModal(true)}
        />
      </div>

      {/* MODALS */}
      {showTreeModal && (
        <div className="layer-modal-backdrop" onClick={() => setShowTreeModal(false)}>
          <div className="layer-modal-content" onClick={e => e.stopPropagation()}>
            <div className="layer-modal-header">
              <h3>Accessibility Tree / Semantic Structure</h3>
              <button type="button" className="layer-modal-close" onClick={() => setShowTreeModal(false)}>&times;</button>
            </div>
            <div className="layer-modal-body">
              <div className="compact-tree" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {snapshot && (
                  <TreeNode
                    node={snapshot}
                    screenshotMeta={screenshotMeta}
                    selectedNodeId={selectedNodeId}
                    selectedPath={selectedPath}
                    onSelectNode={(nodeId) => {
                      onSelectNode(nodeId)
                      setShowTreeModal(false)
                    }}
                    isFocused={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showContentModal && (
        <div className="layer-modal-backdrop" onClick={() => setShowContentModal(false)}>
          <div className="layer-modal-content" onClick={e => e.stopPropagation()}>
            <div className="layer-modal-header">
              <h3>Readable Extracted Content</h3>
              <button type="button" className="layer-modal-close" onClick={() => setShowContentModal(false)}>&times;</button>
            </div>
            <div className="layer-modal-body llm-raw" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <pre>{readable?.markdown || 'No readable content extracted.'}</pre>
            </div>
          </div>
        </div>
      )}

      {showScoreModal && (
        <div className="layer-modal-backdrop" onClick={() => setShowScoreModal(false)}>
          <div className="layer-modal-content" onClick={e => e.stopPropagation()}>
            <div className="layer-modal-header">
              <h3>AI Visibility Score Breakdown</h3>
              <button type="button" className="layer-modal-close" onClick={() => setShowScoreModal(false)}>&times;</button>
            </div>
            <div className="layer-modal-body">
              <div className="score-breakdown-list">
                {scoreBreakdown?.items?.map(item => (
                  <div key={item.label} className="breakdown-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{item.label}</span>
                    <strong style={{ color: item.value < 0 ? 'var(--poor)' : item.value > 0 ? 'var(--good)' : 'var(--text)' }}>
                      {item.value > 0 ? `+${item.value}` : item.value}
                    </strong>
                  </div>
                ))}
                <div className="breakdown-item total" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontSize: '1.2rem' }}>
                  <strong>Total AI Visibility Score</strong>
                  <strong style={{ color: 'var(--good)' }}>{score}/100</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function HumanViewCompact({ screenshot, fullPageScreenshot, screenshotMeta, isFocused }) {
  const dimensions = screenshotMeta?.viewport
    ? `${screenshotMeta.viewport.width} × ${screenshotMeta.viewport.height}`
    : null

  const handleOpenFullPage = () => {
    const activeScr = fullPageScreenshot || screenshot
    if (activeScr) {
      const win = window.open()
      win.document.write(`<iframe src="data:image/png;base64,${activeScr}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
    }
  }

  return (
    <div className={`layer-card human-card ${isFocused ? 'focused' : ''}`}>
      <div className="layer-card-header">
        <div>
          <p className="card-eyebrow">Human View</p>
          <h3>What users see</h3>
        </div>
        <span className="card-meta">{dimensions || ''}</span>
      </div>

      <div className="perspective-frame flat-preview">
        {screenshot ? (
          <div className="perspective-stage flat">
            <div className="browser-chrome">
              <div className="chrome-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="chrome-url-bar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L12 12M12 12L8 8M12 12L16 8" />
                </svg>
                <span>{screenshotMeta?.url || 'Page Preview'}</span>
              </div>
            </div>
            <div className="browser-viewport">
              <img
                src={`data:image/png;base64,${screenshot}`}
                alt="Analyzed page viewport"
                draggable="false"
              />
            </div>
          </div>
        ) : (
          <div className="empty-preview">No screenshot captured.</div>
        )}
      </div>

      <button className="view-raw-btn" type="button" onClick={handleOpenFullPage}>
        Open full page
      </button>
    </div>
  )
}

function LoadingLayerCard({ title, eyebrow }) {
  return (
    <div className="layer-card loading-layer-card">
      <div className="layer-card-header">
        <div>
          <p className="card-eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <span className="card-meta">Loading</span>
      </div>

      <div className="loading-card-body">
        <div className="skeleton-box" style={{ height: '180px', width: '100%', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ height: '12px', width: '75%', marginBottom: '8px' }} />
        <div className="skeleton-box" style={{ height: '12px', width: '48%' }} />
      </div>
    </div>
  )
}

function LoadingScoreCard() {
  return (
    <div className="layer-card score-card loading-score-card focused">
      <p className="card-eyebrow center">AI Visibility Score</p>
      <div className="loading-ring" />
      <div className="loading-score-label">Building</div>
      <p className="score-desc">AI is assembling the evidence before the score settles.</p>
    </div>
  )
}

function MachineStructureCompact({ snapshot, isFocused, onViewTree }) {
  const landmarks = useMemo(() => getLandmarksAndCounts(snapshot), [snapshot])
  const headerCount = useMemo(() => landmarks.header.reduce((sum, n) => sum + countNodesInSubtree(n), 0), [landmarks.header])
  const navCount = useMemo(() => landmarks.nav.reduce((sum, n) => sum + countNodesInSubtree(n), 0), [landmarks.nav])
  const mainCount = useMemo(() => landmarks.main.reduce((sum, n) => sum + countNodesInSubtree(n), 0), [landmarks.main])
  const footerCount = useMemo(() => landmarks.footer.reduce((sum, n) => sum + countNodesInSubtree(n), 0), [landmarks.footer])

  return (
    <div className={`layer-card structure-card ${isFocused ? 'focused' : ''}`}>
      <div className="layer-card-header">
        <div>
          <p className="card-eyebrow">Accessibility Tree</p>
          <h3>What browsers & assistive tech see</h3>
        </div>
      </div>

      <div className="landmark-list-view">
        <div className="landmark-item">
          <div className="landmark-item-left">
            <span className="landmark-caret">&gt;</span>
            <svg className="landmark-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="landmark-name">Document</span>
          </div>
          <span className="landmark-badge">1 root</span>
        </div>

        <div className="landmark-item">
          <div className="landmark-item-left">
            <span className="landmark-caret">&gt;</span>
            <svg className="landmark-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="3" y="3" width="18" height="6" rx="1"/><rect x="3" y="11" width="18" height="10" rx="1"/></svg>
            <span className="landmark-name">Header</span>
          </div>
          <span className="landmark-badge">{headerCount} {headerCount === 1 ? 'node' : 'nodes'}</span>
        </div>

        <div className="landmark-item">
          <div className="landmark-item-left">
            <span className="landmark-caret">&gt;</span>
            <svg className="landmark-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <span className="landmark-name">Navigation</span>
          </div>
          <span className="landmark-badge">{navCount} {navCount === 1 ? 'node' : 'nodes'}</span>
        </div>

        <div className="landmark-item">
          <div className="landmark-item-left">
            <span className="landmark-caret">&gt;</span>
            <svg className="landmark-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            <span className="landmark-name">Main Content</span>
          </div>
          <span className="landmark-badge">{mainCount} {mainCount === 1 ? 'node' : 'nodes'}</span>
        </div>

        <div className="landmark-item">
          <div className="landmark-item-left">
            <span className="landmark-caret">&gt;</span>
            <svg className="landmark-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="3" y="15" width="18" height="6" rx="1"/><rect x="3" y="3" width="18" height="10" rx="1"/></svg>
            <span className="landmark-name">Footer</span>
          </div>
          <span className="landmark-badge">{footerCount} {footerCount === 1 ? 'node' : 'nodes'}</span>
        </div>
      </div>

      <button className="view-raw-btn" type="button" onClick={onViewTree}>
        View tree
      </button>
    </div>
  )
}

function LLMExtractionCompact({ readable, snapshot, isFocused, onViewContent }) {
  const summary = useMemo(() => summarizeReadable(readable), [readable])
  const wordCount = readable?.wordCount ?? 0
  const headingCount = useMemo(() => {
    return (readable?.markdown?.match(/^#{1,6}\s+/gm) || []).length || summary.headings.length
  }, [readable, summary])

  const linkCount = useMemo(() => {
    if (!snapshot) return 0
    const counts = countAllRoles(snapshot)
    return counts['a'] || 0
  }, [snapshot])

  return (
    <div className={`layer-card llm-card ${isFocused ? 'focused' : ''}`}>
      <div className="layer-card-header">
        <div>
          <p className="card-eyebrow">Readable Content</p>
          <h3>What LLMs can extract</h3>
        </div>
      </div>

      <div className="llm-compact-stats">
        <div className="llm-stat-col">
          <strong className="llm-stat-number">{wordCount.toLocaleString()}</strong>
          <span className="llm-stat-label">words</span>
        </div>
        <div className="llm-stat-col">
          <strong className="llm-stat-number">{headingCount}</strong>
          <span className="llm-stat-label">headings</span>
        </div>
        <div className="llm-stat-col">
          <strong className="llm-stat-number">{linkCount}</strong>
          <span className="llm-stat-label">links</span>
        </div>
      </div>

      <div className="llm-body">
        <p className="llm-excerpt">{summary.overview}</p>
      </div>

      <button className="view-raw-btn" type="button" onClick={onViewContent}>
        View extracted content
      </button>
    </div>
  )
}

function ScoreGauge({ score, isFocused, onViewScoreBreakdown }) {
  const gaugeRef = useRef(null)
  const [animatedScore, setAnimatedScore] = useState(0)
  const normalizedScore = Math.max(0, Math.min(100, score || 0))

  const verdict = getScoreVerdict(normalizedScore)
  const scoreColor = verdict.color
  const scoreLabel = verdict.label

  const scoreDescription = normalizedScore >= 90
    ? 'AI can understand this page'
    : normalizedScore >= 75
    ? 'AI has good page understanding'
    : normalizedScore >= 55
    ? 'AI understanding is limited'
    : 'AI struggles to understand page'

  useEffect(() => {
    let frame
    const start = performance.now()
    const duration = 1200

    function animate(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * normalizedScore))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [normalizedScore])

  const size = 128
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className={`layer-card score-card ${isFocused ? 'focused' : ''}`}>
      <p className="card-eyebrow center">AI VISIBILITY SCORE</p>

      <div className="gauge-container" ref={gaugeRef}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="gauge-ring"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              filter: `drop-shadow(0 0 8px ${scoreColor}66)`,
              transition: 'stroke-dashoffset 0.3s ease'
            }}
          />
        </svg>

        <div className="gauge-label">
          <span className="gauge-number" style={{ color: scoreColor }}>
            {animatedScore}
          </span>
          <span className="gauge-max">/100</span>
        </div>
      </div>

      <div className="score-verdict" style={{ color: scoreColor }}>
        {scoreLabel}
      </div>
      <p className="score-desc">{scoreDescription}</p>

      <button
        className="score-breakdown-link-btn"
        type="button"
        onClick={onViewScoreBreakdown}
      >
        View score breakdown
      </button>
    </div>
  )
}

function findNodePath(node, nodeId, path = []) {
  if (!node || !nodeId) return []
  const nextPath = [...path, node.id]
  if (node.id === nodeId) return nextPath
  for (const child of node.children || []) {
    const childPath = findNodePath(child, nodeId, nextPath)
    if (childPath.length) return childPath
  }
  return []
}

function countAllRoles(node) {
  const acc = {}
  function walk(n) {
    if (!n) return
    const role = n.role || 'node'
    acc[role] = (acc[role] || 0) + 1
    for (const child of n.children || []) walk(child)
  }
  walk(node)
  return acc
}

function countNodesInSubtree(node) {
  if (!node) return 0
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countNodesInSubtree(child)
    }
  }
  return count
}

function getLandmarksAndCounts(snapshot) {
  const landmarks = {
    document: null,
    header: [],
    nav: [],
    main: [],
    footer: []
  }

  function walk(node) {
    if (!node) return
    const role = node.role || ''
    if (role === 'document' && !landmarks.document) {
      landmarks.document = node
    } else if (role === 'header') {
      landmarks.header.push(node)
    } else if (role === 'nav') {
      landmarks.nav.push(node)
    } else if (role === 'main') {
      landmarks.main.push(node)
    } else if (role === 'footer') {
      landmarks.footer.push(node)
    }
    if (node.children) {
      for (const child of node.children) walk(child)
    }
  }

  walk(snapshot)
  return landmarks
}

function summarizeReadable(readable) {
  const markdown = readable?.markdown || ''
  const text = markdown.replace(/[#*_`[\]()]/g, ' ')
  const headings = [...markdown.matchAll(/^#{1,3}\s+(.+)$/gm)]
    .map(match => clean(match[1]))
    .filter(Boolean)
    .slice(0, 8)
  const entities = getEntities(text)
  const contact = getContactSignals(text)
  const business = getBusinessSignals(text)

  return {
    overview: readable?.excerpt || firstSentence(text) || 'No readable summary could be extracted.',
    headings,
    entities,
    contact,
    business,
    signalCount: entities.length + contact.length + business.length
  }
}

function getEntities(text) {
  const matches = text.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3}\b/g) || []
  return unique(matches.map(clean))
    .filter(item => !/^(Read More|Learn More|Privacy Policy|Terms Conditions)$/i.test(item))
    .slice(0, 8)
}

function getContactSignals(text) {
  const signals = []
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]
  const address = text.match(/\b\d{2,6}\s+[A-Za-z0-9.,\s-]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd)\b/i)?.[0]

  if (email) signals.push(email)
  if (phone) signals.push(clean(phone))
  if (address) signals.push(clean(address))

  return unique(signals).slice(0, 5)
}

function getBusinessSignals(text) {
  const lines = text
    .split(/\n+/)
    .map(clean)
    .filter(line => /\b(pricing|services|products|customers|locations|hours|booking|demo|support|about)\b/i.test(line))

  return unique(lines).slice(0, 6)
}

function firstSentence(text) {
  return clean(text).split(/(?<=[.!?])\s+/)[0]?.slice(0, 220)
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

function clean(value = '') {
  return value.replace(/\s+/g, ' ').trim()
}
