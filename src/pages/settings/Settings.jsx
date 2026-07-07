import { useState, useEffect } from 'react'

export default function Settings() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('secondsight-theme') || 'system'
  })

  useEffect(() => {
    localStorage.setItem('secondsight-theme', theme)
    
    /* Light mode temporarily disabled
    // Apply immediately so Settings feels snappy
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
    
    // Dispatch storage event so App.jsx picks it up across the app
    window.dispatchEvent(new Event('storage'))
    */
  }, [theme])

  return (
    <div style={{ padding: '32px 48px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontSize: '1.75rem', color: 'var(--text)', marginBottom: '32px', fontWeight: 600 }}>Settings</h2>
      
      <section className="section-block" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', margin: '0 0 16px', fontWeight: 600 }}>Appearance</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--faint)', fontSize: '0.95rem', margin: '0', lineHeight: 1.5 }}>
            Choose your preferred theme for the GEO Optimizer interface. Select 'System' to automatically match your OS settings.
          </p>
          
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--bg)', 
            padding: '4px', 
            borderRadius: '10px', 
            border: '1px solid var(--border)',
            alignSelf: 'flex-start'
          }}>
            {['system', 'dark', 'light'].map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  background: theme === t ? 'var(--panel-soft)' : 'transparent',
                  border: 'none',
                  color: theme === t ? 'var(--text)' : 'var(--muted)',
                  padding: '8px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: theme === t ? 600 : 500,
                  textTransform: 'capitalize',
                  transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
                  boxShadow: theme === t ? '0 1px 3px rgba(var(--overlay-rgb), 0.05), 0 0 0 1px var(--border)' : 'none'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
