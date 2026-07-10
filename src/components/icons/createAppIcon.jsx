import { createElement } from 'react'

export const APP_ICON_DEFAULTS = {
  size: 15,
  strokeWidth: 1.7,
  'aria-hidden': true,
}

export function createAppIcon(LucideIcon) {
  function AppIcon(props) {
    return createElement(LucideIcon, { ...APP_ICON_DEFAULTS, ...props })
  }

  AppIcon.displayName = `${LucideIcon.displayName || LucideIcon.name || 'App'}Icon`
  return AppIcon
}
