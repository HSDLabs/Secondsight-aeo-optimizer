import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Check, ExternalLink, Share2 } from 'lucide-react'
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

  useEffect(() => {
    const handleShortcut = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setIsSidebarCollapsed(current => !current)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

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
                <span className="topbar-url"><span className="topbar-url-mark" />{data.url || url}</span>
                <span className="topbar-badge">
                  <Check size={12} />
                  Analysis complete
                </span>
              </div>
              <div className="topbar-actions">
                <a className="topbar-source-link" href={data.url || url} target="_blank" rel="noreferrer" aria-label="Open analyzed website"><ExternalLink size={14} /></a>
                <button type="button" className="topbar-share-btn" onClick={handleShare}><Share2 size={14} />Share report</button>
              </div>
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
