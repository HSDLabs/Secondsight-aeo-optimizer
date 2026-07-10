import { NavLink } from 'react-router-dom'
import { OverviewIcon } from '../../components/icons'
import { sidebarIcons } from './sidebarIcons'

export default function SidebarNavItem({ item, isCollapsed }) {
  const Icon = sidebarIcons[item.path] || OverviewIcon

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
      title={isCollapsed ? item.label : undefined}
      aria-label={isCollapsed ? item.label : undefined}
    >
      <span className="sidebar-icon"><Icon /></span>
      {!isCollapsed && <span className="sidebar-link-text">{item.label}</span>}
      {!isCollapsed && <span className="sidebar-active-mark" aria-hidden="true" />}
    </NavLink>
  )
}
