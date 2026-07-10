import SidebarNavItem from './SidebarNavItem'

export default function SidebarSection({ label, items, isCollapsed }) {
  return (
    <section className="sidebar-group" aria-labelledby={isCollapsed ? undefined : `sidebar-${label}`}>
      {!isCollapsed && <h2 id={`sidebar-${label}`} className="sidebar-group-label">{label}</h2>}
      {isCollapsed && <span className="sidebar-group-divider" aria-hidden="true" />}
      <div className="sidebar-group-links">
        {items.map(item => <SidebarNavItem key={item.path} item={item} isCollapsed={isCollapsed} />)}
      </div>
    </section>
  )
}
