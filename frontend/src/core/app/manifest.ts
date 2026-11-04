import type { ComponentType } from 'react'
import type { IconName } from '@/core/components/ui/Icon'
import type { RouteHandle } from './routeHandle'

export type NavGroup = 'primary' | 'operations' | 'admin'

export type NavArea = 'Sales' | 'Inventory' | 'Procurement' | 'Accounting' | 'Admin'

export interface NavEntry {
  label: string
  icon: IconName
  to: string
  group: NavGroup
  sequence: number
  area?: NavArea
}

export interface ScreenRoute {
  id: string
  path: string
  load: () => Promise<ComponentType>
  crumb?: RouteHandle['crumb']
  view?: RouteHandle['view']
  layout?: 'shell' | 'bare'
  example?: string
  writes?: string[]
}

export interface RedirectRoute {
  path: string
  redirect: string
}

export type RouteContribution = ScreenRoute | RedirectRoute

export function isScreenRoute(route: RouteContribution): route is ScreenRoute {
  return 'load' in route
}

export interface AddonManifest {
  name: string
  depends: string[]
  screens: string[]
  routes: RouteContribution[]
  nav?: NavEntry
}
