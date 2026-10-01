import { useLocation, useMatches } from 'react-router'
import { moduleFor } from './registry'
import { isRouteHandle, resolveCrumb, type RouteHandle } from './routeHandle'

export interface Crumb {
  label: string
  to?: string
}

export interface Crumbs {
  crumbs: Crumb[]
  module?: string
  view?: RouteHandle['view']
}

export function useCrumbs(): Crumbs {
  const matches = useMatches()
  const { pathname } = useLocation()
  const addon = moduleFor(pathname)

  const crumbs: Crumb[] = []
  let view: RouteHandle['view']

  if (addon) crumbs.push({ label: addon.label, to: addon.to })

  for (const match of matches) {
    if (!isRouteHandle(match.handle)) continue

    const label = resolveCrumb(match.handle, match.params)
    if (match.handle.view) view = match.handle.view
    if (!label) continue
    if (crumbs.some((crumb) => crumb.label === label)) continue

    crumbs.push({ label, to: match.pathname })
  }

  if (crumbs.length > 0) delete crumbs[crumbs.length - 1].to

  return { crumbs, module: addon?.name, view }
}
