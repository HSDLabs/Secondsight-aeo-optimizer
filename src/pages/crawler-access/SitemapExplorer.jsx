import { buildSitemapTree, getProbedDetails } from './crawlerUtils'

export default function SitemapExplorer({ sitemaps, origin, issues, expandedSitemaps, sitemapsPageSize, toggleSitemap, loadMoreSitemapUrls }) {
  const sitemapTree = buildSitemapTree(sitemaps)
  const sitemapUrlsList = sitemaps?.urls || []

  const detailsGetter = (locUrl) => getProbedDetails(sitemaps, issues, locUrl)

  return (
    <section className="section-block" aria-labelledby="sitemap-explorer-title">
      <div className="crawler-section-header">
        <div>
          <p className="eyebrow">Index Inspector</p>
          <h2 id="sitemap-explorer-title">Sitemap Explorer</h2>
          <p>Navigate the nested layout of sitemap indices down to specific URL states.</p>
        </div>
        <span className="crawler-step-tag">Step 3</span>
      </div>

      <div className="sitemap-explorer-container">
        {sitemapTree.length > 0 ? (
          <div className="tree-view-root">
            {sitemapTree.map(node => {
              const isExpanded = !!expandedSitemaps[node.url]
              const isIndex = node.type === 'index'
              const nodeUrls = isIndex ? [] : sitemapUrlsList.filter(u => u.source === node.url)
              const limit = sitemapsPageSize[node.url] || 15
              const paginatedUrls = nodeUrls.slice(0, limit)
              const hasMore = nodeUrls.length > limit

              return (
                <div key={node.url} className="tree-node-item">
                  {/* Node Row */}
                  <div 
                    className="tree-node-row" 
                    onClick={() => toggleSitemap(node.url)}
                  >
                    <div className="tree-node-left">
                      <span className={`tree-node-caret ${isExpanded ? 'expanded' : ''}`}>
                        ▶
                      </span>
                      <span className="tree-node-icon">
                        {isIndex ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--accent)" strokeWidth="2.5" fill="none">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--muted)" strokeWidth="2.5" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                          </svg>
                        )}
                      </span>
                      <span className="tree-node-name">{node.url.replace(origin, '')}</span>
                    </div>
                    
                    <div className="tree-node-right">
                      <span className="tree-node-meta">
                        {isIndex ? `${node.childCount} sitemaps` : `${nodeUrls.length} pages`}
                      </span>
                      <span className={`tree-node-badge ${node.ok ? 'status-2xx' : 'status-4xx'}`}>
                        {node.ok ? 'OK' : 'Error'}
                      </span>
                    </div>
                  </div>

                  {/* Children List */}
                  {isExpanded && (
                    <div className="tree-node-children">
                      {/* Case 1: Sitemap Index Children */}
                      {isIndex && node.children?.map(childSet => {
                        const isChildExpanded = !!expandedSitemaps[childSet.url]
                        const childUrls = sitemapUrlsList.filter(u => u.source === childSet.url)
                        const childLimit = sitemapsPageSize[childSet.url] || 15
                        const paginatedChildUrls = childUrls.slice(0, childLimit)
                        const childHasMore = childUrls.length > childLimit

                        return (
                          <div key={childSet.url} className="tree-node-item">
                            <div 
                              className="tree-node-row" 
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSitemap(childSet.url)
                              }}
                            >
                              <div className="tree-node-left">
                                <span className={`tree-node-caret ${isChildExpanded ? 'expanded' : ''}`}>
                                  ▶
                                </span>
                                <span className="tree-node-icon">
                                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="var(--muted)" strokeWidth="2.5" fill="none">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14,2 14,8 20,8" />
                                  </svg>
                                </span>
                                <span className="tree-node-name">{childSet.url.replace(origin, '')}</span>
                              </div>
                              <div className="tree-node-right">
                                <span className="tree-node-meta">{childUrls.length} pages</span>
                                <span className={`tree-node-badge ${childSet.ok ? 'status-2xx' : 'status-4xx'}`}>
                                  {childSet.ok ? 'OK' : 'Failed'}
                                </span>
                              </div>
                            </div>

                            {isChildExpanded && (
                              <div className="tree-node-children">
                                {paginatedChildUrls.map(u => {
                                  const details = detailsGetter(u.loc)
                                  const isBlockedNode = details.blocked
                                  const isNoindexNode = details.noindex
                                  
                                  return (
                                    <div key={u.loc} className="tree-node-row" style={{ cursor: 'default' }}>
                                      <div className="tree-node-left">
                                        <span className="tree-node-caret" style={{ opacity: 0 }}>▶</span>
                                        <span className="tree-node-name url-path">{u.loc.replace(origin, '')}</span>
                                      </div>
                                      <div className="tree-node-right">
                                        {details.timing > 0 && <span className="tree-node-meta">{details.timing}ms</span>}
                                        <span className={`tree-node-badge ${
                                          isBlockedNode ? 'status-blocked' : (isNoindexNode ? 'status-blocked' : 'status-2xx')
                                        }`}>
                                          {isBlockedNode ? 'Blocked' : (isNoindexNode ? 'Noindex' : `200 OK`)}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                                {childHasMore && (
                                  <div 
                                    className="tree-node-expand-more"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      loadMoreSitemapUrls(childSet.url, childUrls.length)
                                    }}
                                  >
                                    + Show {Math.min(30, childUrls.length - childLimit)} more URLs ({childUrls.length - childLimit} remaining)
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Case 2: Standard Sitemap URLs */}
                      {!isIndex && paginatedUrls.map(u => {
                        const details = detailsGetter(u.loc)
                        const isBlockedNode = details.blocked
                        const isNoindexNode = details.noindex

                        return (
                          <div key={u.loc} className="tree-node-row" style={{ cursor: 'default' }}>
                            <div className="tree-node-left">
                              <span className="tree-node-caret" style={{ opacity: 0 }}>▶</span>
                              <span className="tree-node-name url-path">{u.loc.replace(origin, '')}</span>
                            </div>
                            <div className="tree-node-right">
                              {details.timing > 0 && <span className="tree-node-meta">{details.timing}ms</span>}
                              <span className={`tree-node-badge ${
                                isBlockedNode ? 'status-blocked' : (isNoindexNode ? 'status-blocked' : 'status-2xx')
                              }`}>
                                {isBlockedNode ? 'Blocked' : (isNoindexNode ? 'Noindex' : `200 OK`)}
                              </span>
                            </div>
                          </div>
                        )
                      })}

                      {!isIndex && hasMore && (
                        <div 
                          className="tree-node-expand-more"
                          onClick={(e) => {
                            e.stopPropagation()
                            loadMoreSitemapUrls(node.url, nodeUrls.length)
                          }}
                        >
                          + Show {Math.min(30, nodeUrls.length - limit)} more URLs ({nodeUrls.length - limit} remaining)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '0.86rem', textAlign: 'center', padding: '16px 0' }}>
            No sitemaps discovered for this origin.
          </div>
        )}
      </div>
    </section>
  )
}
