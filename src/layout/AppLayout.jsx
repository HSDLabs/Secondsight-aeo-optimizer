import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import URLInput from '../components/URLInput'

// Shared layout: persistent sidebar + a global header hosting the URL input,
// with the active section rendered in the Outlet. It owns no state — the
// analysis state is passed down from App and forwarded to pages via Outlet
// context, so one analysis stays live as the user moves between sections.
export default function AppLayout({ url, setUrl, analyze, loading, outletContext }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const data = outletContext?.data
  const hasData = !!data

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'GEO Optimizer Report',
        text: `Check out the GEO Optimizer Report for ${data?.url || url}`,
        url: window.location.href
      }).catch(err => console.error(err))
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Report link copied to clipboard!')
    }
  }

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="app-main">
        <header className="app-topbar">
          {hasData ? (
            <div className="app-topbar-complete">
              <div className="app-topbar-left">
                <span className="topbar-url">
                  {data.url || url}
                </span>
                <span className="topbar-badge">
                  <span className="topbar-badge-dot" />
                  {loading ? 'Analyzing...' : 'Analysis complete'}
                </span>
              </div>
              <button
                type="button"
                className="topbar-share-btn"
                onClick={handleShare}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                Share Report
              </button>
            </div>
          ) : (
            <URLInput
              value={url}
              onChange={setUrl}
              onAnalyze={analyze}
              loading={loading}
            />
          )}
        </header>

        <main className="app-content">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  )
}
