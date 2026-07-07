import { buildDiscoveryGraph } from './crawlerUtils'

const getNodeColor = (node) => {
  if (node.type === 'more_indicator') return 'var(--faint)'
  if (node.blocked) return 'var(--poor)'
  if (node.noindex) return 'var(--warning)'
  if (!node.inSitemap) return '#8b96a8'
  if (node.status >= 400 || node.status === 0) return 'var(--poor)'
  return 'var(--good)'
}

export default function DiscoveryGraph({ crawlerData, activeGraphNode, setActiveGraphNode }) {
  const {
    graphNodes,
    graphLinks,
    canvasHeight,
    canvasWidth,
    nodeMap
  } = buildDiscoveryGraph(crawlerData)

  return (
    <section className="section-block" aria-labelledby="discovery-graph-title">
      <div className="crawler-section-header">
        <div>
          <p className="eyebrow">Topology Graph</p>
          <h2 id="discovery-graph-title">Discovery Graph</h2>
          <p>Visual path segments tree demonstrating page reachability, index blocks, and orphans.</p>
        </div>
        <span className="crawler-step-tag">Step 4</span>
      </div>

      <div className="discovery-graph-container">
        <div className="graph-legend">
          <div className="legend-item">
            <span className="legend-dot reachable" />
            <span>Reachable</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot blocked" />
            <span>Blocked</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot noindex" />
            <span>Noindex</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot orphan" />
            <span>Orphan (Not in Sitemap)</span>
          </div>
        </div>

        <div className="graph-canvas-wrapper">
          <svg 
            width={canvasWidth} 
            height={canvasHeight} 
            className="graph-canvas"
          >
            <defs>
              <filter id="glow-good" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render Link Paths */}
            {graphLinks.map((link, idx) => {
              const sourceNode = nodeMap.get(link.source)
              const targetNode = nodeMap.get(link.target)
              if (!sourceNode || !targetNode) return null

              // Compute smooth bezier line curve
              const dx = targetNode.x - sourceNode.x
              const pathStr = `M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x + dx/2} ${sourceNode.y}, ${sourceNode.x + dx/2} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`
              
              const isActive = activeGraphNode?.path === sourceNode.path || activeGraphNode?.path === targetNode.path

              return (
                <path 
                  key={idx} 
                  d={pathStr} 
                  className={`graph-link ${isActive ? 'active' : ''}`}
                />
              )
            })}

            {/* Render Node Points */}
            {graphNodes.map(node => {
              const nodeColor = getNodeColor(node)
              const isHovered = activeGraphNode?.path === node.path
              
              return (
                <g 
                  key={node.path} 
                  className="graph-node"
                  style={{ '--node-color': nodeColor }}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => node.type !== 'more_indicator' && setActiveGraphNode(node)}
                  onMouseLeave={() => setActiveGraphNode(null)}
                >
                  <circle 
                    cx="0" 
                    cy="0" 
                    r={isHovered ? 8 : 6} 
                    fill={nodeColor}
                    style={{ 
                      transition: 'r 0.15s ease',
                      filter: isHovered ? 'url(#glow-good)' : 'none'
                    }}
                  />
                  
                  <text 
                    x="12" 
                    y="4" 
                    fill="var(--text)"
                    fontSize="11"
                    style={{ 
                      fontWeight: isHovered ? 600 : 500,
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}
                  >
                    {node.name.length > 20 ? `${node.name.substring(0, 18)}…` : node.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Floating Graph Detail Tooltip */}
        {activeGraphNode && activeGraphNode.type !== 'more_indicator' && (
          <div className="graph-tooltip-card">
            <div className="tooltip-card-header">
              <span className="tooltip-card-title">{activeGraphNode.name}</span>
              <span 
                className="crawler-status-badge"
                style={{
                  fontSize: '0.62rem',
                  padding: '2px 6px',
                  borderColor: getNodeColor(activeGraphNode),
                  color: getNodeColor(activeGraphNode),
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                {activeGraphNode.blocked ? 'Blocked' : (activeGraphNode.noindex ? 'Noindex' : 'Reachable')}
              </span>
            </div>
            
            <div className="tooltip-card-row">
              <span>Path:</span>
              <strong style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>{activeGraphNode.path}</strong>
            </div>
            
            <div className="tooltip-card-row">
              <span>Status Code:</span>
              <strong>{activeGraphNode.status === 0 ? 'Failed' : activeGraphNode.status}</strong>
            </div>
            
            <div className="tooltip-card-row">
              <span>Sitemap Status:</span>
              <strong>{activeGraphNode.inSitemap ? 'In Sitemap' : 'Orphan (Not in Sitemap)'}</strong>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
