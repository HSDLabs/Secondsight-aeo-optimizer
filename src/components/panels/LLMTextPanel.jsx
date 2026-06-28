import { useState } from 'react'

export default function LLMTextPanel({ readable }) {
  const [activeTab, setActiveTab] = useState('summary')
  const summary = summarizeReadable(readable)
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
        {[
          ['summary', 'Summary'],
          ['metadata', 'Metadata'],
          ['raw', 'Raw Extraction']
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="llm-content summary-view">
          <p className="excerpt">{summary.overview}</p>

          <div className="summary-metrics">
            <div>
              <span>Words</span>
              <strong>{(readable?.wordCount ?? 0).toLocaleString()}</strong>
            </div>
            <div>
              <span>Headings</span>
              <strong>{summary.headings.length}</strong>
            </div>
            <div>
              <span>Signals</span>
              <strong>{summary.signalCount}</strong>
            </div>
          </div>

          <SummaryList title="Major Headings" items={summary.headings} />
          <SummaryList title="Key Entities" items={summary.entities} />
          <SummaryList title="Contact Information" items={summary.contact} />
          <SummaryList title="Business Information" items={summary.business} />
        </div>
      )}

      {activeTab === 'metadata' && (
        <dl className="metadata-list">
          {metadata.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {activeTab === 'raw' && (
        <div className="llm-content">
          <pre>{readable?.markdown || 'No readable content extracted.'}</pre>
        </div>
      )}
    </section>
  )
}

function SummaryList({ title, items }) {
  return (
    <section className="summary-section">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul>
          {items.map(item => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p>No strong signal extracted.</p>
      )}
    </section>
  )
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
