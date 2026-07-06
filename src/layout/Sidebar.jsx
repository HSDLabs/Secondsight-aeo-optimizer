import { NavLink } from 'react-router-dom'
import { navItems, NAV_GROUPS } from '../navigation'
import { useState } from 'react'

export default function Sidebar({ url, setUrl, analyze, loading, data, analyzedAt }) {
  return (
    <aside className="sidebar" aria-label="Primary" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', paddingBottom: '16px' }}>
      <div>
        <div className="sidebar-brand" style={{ padding: '24px 20px' }}>
          <p className="eyebrow" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem', color: 'var(--muted)' }}>SecondSight</p>
          <h1 className="sidebar-tagline" style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>GEO Optimizer</h1>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map(group => {
            const items = navItems.filter(item => item.group === group)
            if (items.length === 0) return null

            return (
              <div key={group} className="sidebar-group">
                <p className="sidebar-group-label">{group}</p>
                {items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-link is-active' : 'sidebar-link'
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
      </div>

      {data && (
        <div style={{ padding: '0 20px' }}>
          <SidebarAnalysisCard
            url={url}
            setUrl={setUrl}
            analyze={analyze}
            loading={loading}
            data={data}
            analyzedAt={analyzedAt}
          />
        </div>
      )}
    </aside>
  )
}

function SidebarAnalysisCard({ url, setUrl, analyze, loading, data, analyzedAt }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editUrl, setEditUrl] = useState(url)

  if (!data) return null

  const domain = data.url ? data.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : ''

  const handleSave = (e) => {
    e.preventDefault()
    if (editUrl.trim()) {
      setUrl(editUrl)
      analyze()
      setIsEditing(false)
    }
  }

  return (
    <div className="sidebar-analysis-card" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="card-label" style={{ fontSize: '0.7rem', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Analysis for</div>
      {isEditing ? (
        <form onSubmit={handleSave} className="sidebar-url-edit-form" style={{ display: 'flex', gap: '6px' }}>
          <input 
            type="text" 
            value={editUrl} 
            onChange={(e) => setEditUrl(e.target.value)} 
            className="sidebar-url-edit-input"
            autoFocus
            style={{ flex: 1, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', padding: '4px 8px', fontSize: '0.78rem', outline: 'none' }}
          />
          <button type="submit" className="sidebar-url-save-btn" style={{ background: 'var(--accent)', border: 'none', borderRadius: '4px', color: 'white', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}>Go</button>
        </form>
      ) : (
        <div className="card-domain-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="card-domain" style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{domain}</span>
          <button 
            type="button" 
            className="card-edit-btn" 
            onClick={() => {
              setEditUrl(url)
              setIsEditing(true)
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" /></svg>
          </button>
        </div>
      )}
      <div className="card-time" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
        {loading ? 'Analyzing...' : 'Analyzed just now'}
      </div>
      <button 
        type="button" 
        className="sidebar-reanalyze-btn" 
        disabled={loading} 
        onClick={analyze}
        style={{ width: '100%', background: '#1a1f2e', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', padding: '8px', fontSize: '0.8rem', fontWeight: 550, cursor: 'pointer', transition: 'all 200ms ease' }}
      >
        {loading ? 'Analyzing...' : 'Re-analyze'}
      </button>
      <button 
        type="button" 
        className="sidebar-export-btn"
        onClick={() => {
          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(data, null, 2)
          )}`
          const downloadAnchor = document.createElement('a')
          downloadAnchor.setAttribute('href', jsonString)
          downloadAnchor.setAttribute('download', `${domain || 'secondsight'}-report.json`)
          document.body.appendChild(downloadAnchor)
          downloadAnchor.click()
          downloadAnchor.remove()
        }}
        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}
      >
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        Export Report
      </button>
    </div>
  )
}
