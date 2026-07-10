export default function SidebarBrand({ isCollapsed }) {
  return (
    <div className="sidebar-brand">
      <span className="sidebar-logo-wrap">
        <img src="/logo.svg" alt="" className="sidebar-logo" />
      </span>
      {!isCollapsed && (
        <div className="sidebar-brand-copy">
          <span>SecondSight</span>
          <strong>GEO Optimizer</strong>
        </div>
      )}
    </div>
  )
}
