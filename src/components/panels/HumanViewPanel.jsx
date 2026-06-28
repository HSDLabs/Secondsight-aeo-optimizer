import { useEffect, useRef, useState } from 'react'

export default function HumanViewPanel({
  screenshot,
  screenshots,
  screenshotMeta,
  selectedNode
}) {
  const [dimensions, setDimensions] = useState(null)
  const [mode, setMode] = useState('viewport')
  const [zoom, setZoom] = useState(1)
  const [scrollDebug, setScrollDebug] = useState(null)
  const frameRef = useRef(null)
  const highlightRef = useRef(null)
  const activeScreenshot = screenshots?.[mode] || screenshot
  const overlayBox = getOverlayBox(selectedNode?.bbox, screenshotMeta, mode)
  const overlayKey = overlayBox
    ? `${overlayBox.x}-${overlayBox.y}-${overlayBox.w}-${overlayBox.h}`
    : ''
  const isFitWidth = zoom === 1

  useEffect(() => {
    if (!overlayBox || !highlightRef.current || !frameRef.current) return

    const frame = frameRef.current
    const highlight = highlightRef.current

    const frameHeight = frame.clientHeight
    const highlightTop = highlight.offsetTop
    const highlightHeight = highlight.offsetHeight
    
    // Trigger reflow for flash animation
    highlight.classList.remove('flash')
    void highlight.offsetWidth
    highlight.classList.add('flash')

    const currentScrollTop = frame.scrollTop
    const isVisible = (highlightTop >= currentScrollTop && highlightTop + highlightHeight <= currentScrollTop + frameHeight) ||
                      (highlightTop < currentScrollTop && highlightTop + highlightHeight > currentScrollTop + frameHeight)

    let targetScrollTop = currentScrollTop

    if (!isVisible) {
      if (highlightHeight <= frameHeight) {
        targetScrollTop = highlightTop - (frameHeight / 2) + (highlightHeight / 2)
      } else {
        targetScrollTop = highlightTop
      }

      frame.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    }

    const y = selectedNode?.bbox?.y

    setScrollDebug({
      id: selectedNode?.id,
      y,
      scaledY: highlightTop,
      target: Math.round(targetScrollTop),
      actual: Math.round(frame.scrollTop)
    })

    const timeout = setTimeout(() => {
      setScrollDebug(prev => prev ? { ...prev, actual: Math.round(frame.scrollTop) } : null)
    }, 500)

    return () => clearTimeout(timeout)
  }, [overlayBox, overlayKey, mode, zoom, selectedNode?.id, selectedNode?.bbox?.y])

  function adjustZoom(delta) {
    setZoom(value => Math.max(0.5, Math.min(2.5, Number((value + delta).toFixed(2)))))
  }

  return (
    <section className="analysis-panel human-panel" aria-labelledby="human-view-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">What humans see</p>
          <h2 id="human-view-title">Human View</h2>
        </div>
        <span>{dimensions || 'Screenshot'}</span>
      </div>

      {scrollDebug && (
        <div className="scroll-debug" style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface-2)', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span><strong>ID:</strong> {scrollDebug.id || 'none'}</span>
          <span><strong>BBox Y:</strong> {scrollDebug.y ?? 'none'}</span>
          <span><strong>Scaled Y:</strong> {Math.round(scrollDebug.scaledY)}</span>
          <span><strong>Target:</strong> {scrollDebug.target}</span>
          <span><strong>Actual:</strong> {scrollDebug.actual}</span>
        </div>
      )}

      <div className="mode-switch" aria-label="Screenshot mode">
        <button
          className={mode === 'viewport' ? 'active' : ''}
          type="button"
          onClick={() => setMode('viewport')}
        >
          Viewport
        </button>
        <button
          className={mode === 'fullPage' ? 'active' : ''}
          type="button"
          onClick={() => setMode('fullPage')}
        >
          Full Page
        </button>
      </div>

      <div className="view-tools" aria-label="Screenshot controls">
        <button type="button" onClick={() => adjustZoom(-0.25)}>-</button>
        <button
          className={isFitWidth ? 'active' : ''}
          type="button"
          onClick={() => setZoom(1)}
        >
          Fit Width
        </button>
        <button type="button" onClick={() => adjustZoom(0.25)}>+</button>
        <span>{Math.round(zoom * 100)}%</span>
      </div>

      <div className="screenshot-frame" ref={frameRef}>
        {activeScreenshot ? (
          <div
            className="screenshot-canvas"
            style={{ width: zoom === 1 ? '100%' : `${zoom * 100}%` }}
          >
            <img
              src={`data:image/png;base64,${activeScreenshot}`}
              alt="Analyzed page screenshot"
              onLoad={event => {
                const { naturalWidth, naturalHeight } = event.currentTarget
                setDimensions(`${naturalWidth} x ${naturalHeight}`)
              }}
            />
            {overlayBox && (
              <span
                ref={highlightRef}
                className="screenshot-highlight"
                style={{
                  left: `${overlayBox.x}%`,
                  top: `${overlayBox.y}%`,
                  width: `${overlayBox.w}%`,
                  height: `${overlayBox.h}%`
                }}
              />
            )}
            {mode === 'fullPage' && (
              <button
                className="screenshot-minimap"
                type="button"
                onClick={() => {
                  const frame = frameRef.current
                  const highlight = highlightRef.current
                  if (frame && highlight) {
                    frame.scrollTo({
                      top: highlight.offsetTop - frame.clientHeight / 2 + highlight.offsetHeight / 2,
                      behavior: 'smooth'
                    })
                  }
                }}
                aria-label="Jump to selected region"
              >
                {overlayBox && (
                  <span
                    style={{
                      left: `${overlayBox.x}%`,
                      top: `${overlayBox.y}%`,
                      width: `${Math.max(overlayBox.w, 4)}%`,
                      height: `${Math.max(overlayBox.h, 2)}%`
                    }}
                  />
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="empty-state">No screenshot captured.</div>
        )}
      </div>

      <style>{`
        @keyframes highlightFlash {
          0% { background-color: rgba(255, 255, 255, 0.4); border-color: white; }
          100% { background-color: transparent; }
        }
        .screenshot-highlight.flash {
          animation: highlightFlash 0.8s ease-out;
        }
      `}</style>
    </section>
  )
}

function getOverlayBox(bbox, screenshotMeta, mode) {
  if (!bbox) return null

  const source = mode === 'fullPage'
    ? screenshotMeta?.fullPage
    : screenshotMeta?.viewport

  if (!source?.width || !source?.height) return null

  const clipped = {
    x1: Math.max(0, bbox.x),
    y1: Math.max(0, bbox.y),
    x2: Math.min(source.width, bbox.x + bbox.w),
    y2: Math.min(source.height, bbox.y + bbox.h)
  }

  if (clipped.x2 <= clipped.x1 || clipped.y2 <= clipped.y1) return null

  return {
    x: (clipped.x1 / source.width) * 100,
    y: (clipped.y1 / source.height) * 100,
    w: ((clipped.x2 - clipped.x1) / source.width) * 100,
    h: ((clipped.y2 - clipped.y1) / source.height) * 100
  }
}
