import { useState } from 'react'

export default function HumanViewPanel({ screenshot }) {
  const [dimensions, setDimensions] = useState(null)

  return (
    <section className="analysis-panel human-panel" aria-labelledby="human-view-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">What humans see</p>
          <h2 id="human-view-title">Human View</h2>
        </div>
        <span>{dimensions || 'Screenshot'}</span>
      </div>

      <div className="screenshot-frame">
        {screenshot ? (
          <img
            src={`data:image/png;base64,${screenshot}`}
            alt="Analyzed page screenshot"
            onLoad={event => {
              const { naturalWidth, naturalHeight } = event.currentTarget
              setDimensions(`${naturalWidth} x ${naturalHeight}`)
            }}
          />
        ) : (
          <div className="empty-state">No screenshot captured.</div>
        )}
      </div>
    </section>
  )
}
