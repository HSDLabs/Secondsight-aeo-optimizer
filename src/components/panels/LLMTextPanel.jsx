import { useState } from 'react'

export default function LLMTextPanel({ readable }) {
  const [activeTab, setActiveTab] = useState('content')
  const metadata = [
    ['Title', readable?.title || 'Not extracted'],
    ['Excerpt', readable?.excerpt || 'Not extracted'],
    ['Word count', (readable?.wordCount ?? 0).toLocaleString()]
  ]

  return (
    <section className="analysis-panel llm-panel" aria-labelledby="llm-extraction-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">What AI systems extract</p>
          <h2 id="llm-extraction-title">LLM Extraction</h2>
        </div>
        <span>{readable?.wordCount ?? 0} words</span>
      </div>

      <div className="tabs" role="tablist" aria-label="LLM extraction views">
        <button
          type="button"
          className={activeTab === 'content' ? 'active' : ''}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button
          type="button"
          className={activeTab === 'metadata' ? 'active' : ''}
          onClick={() => setActiveTab('metadata')}
        >
          Metadata
        </button>
      </div>

      {activeTab === 'content' ? (
        <div className="llm-content">
          {readable?.excerpt && <p className="excerpt">{readable.excerpt}</p>}
          <pre>{readable?.markdown || 'No readable content extracted.'}</pre>
        </div>
      ) : (
        <dl className="metadata-list">
          {metadata.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
