import { navItems, NAV_GROUPS } from '../navigation'
import SidebarBrand from './sidebar/SidebarBrand'
import SidebarFooter from './sidebar/SidebarFooter'
import SidebarSection from './sidebar/SidebarSection'

export default function Sidebar({ isCollapsed, onToggle }) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <SidebarBrand isCollapsed={isCollapsed} />
      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => {
          const items = navItems.filter(item => item.group === group)
          if (!items.length) return null
          return <SidebarSection key={group} label={group} items={items} isCollapsed={isCollapsed} />
        })}
      </nav>
      <SidebarFooter isCollapsed={isCollapsed} onToggle={onToggle} />
    </aside>
  )
}
