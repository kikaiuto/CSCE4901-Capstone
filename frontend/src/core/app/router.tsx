import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AppShell } from './AppShell'
import { isScreenRoute, type AddonManifest, type RouteContribution } from './manifest'
import { addons } from './registry'
import type { RouteHandle } from './routeHandle'

function isBare(route: RouteContribution): boolean {
  return isScreenRoute(route) && route.layout === 'bare'
}

function toRouteObject(route: RouteContribution): RouteObject {
  if (!isScreenRoute(route)) {
    return { path: route.path, element: <Navigate to={route.redirect} replace /> }
  }

  const handle: RouteHandle = {}
  if (route.crumb !== undefined) handle.crumb = route.crumb
  if (route.view !== undefined) handle.view = route.view

  return {
    path: route.path,
    lazy: async () => ({ Component: await route.load() }),
    handle,
  }
}

export function routeObjects(manifests: AddonManifest[]): RouteObject[] {
  const contributions = manifests.flatMap((manifest) => manifest.routes)

  return [
    {
      HydrateFallback: () => null,
      children: [
        ...contributions.filter(isBare).map(toRouteObject),
        {
          element: <AppShell />,
          children: [
            ...contributions.filter((route) => !isBare(route)).map(toRouteObject),
            { path: '*', element: <Navigate to="/home" replace /> },
          ],
        },
      ],
    },
  ]
}

export const router = createBrowserRouter(routeObjects(addons))
