import { matchPath, type RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'
import { isScreenRoute, type RedirectRoute } from './manifest'
import { addons, allRoutes, screenRoutes, type OwnedRoute } from './registry'
import { routeObjects } from './router'

describe('the router built from the manifests', () => {
  it('loads a component for every screen route', async () => {
    for (const route of screenRoutes()) {
      const Component = await route.load()
      expect(typeof Component, `${route.id} did not load a component`).toBe('function')
    }
  })

  it('gives every route a unique path and every screen a unique id', () => {
    const paths = allRoutes().map((route) => route.path)
    const ids = screenRoutes().map((route) => route.id)

    expect(new Set(paths).size).toBe(paths.length)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names the screen ids by their addon', () => {
    for (const route of screenRoutes()) {
      expect(route.id.startsWith(`${route.owner}.`), `${route.id} is not under ${route.owner}`).toBe(
        true,
      )
    }
  })

  it('gives every parameterised route an example that matches it', () => {
    for (const route of screenRoutes()) {
      if (!route.path.includes(':')) continue
      expect(route.example, `${route.id} has no example path`).toBeDefined()
      expect(matchPath(route.path, route.example ?? ''), `${route.id} example`).not.toBeNull()
    }
  })

  it('redirects every module root into a screen', () => {
    const redirects = allRoutes().filter(
      (route): route is RedirectRoute & OwnedRoute => !isScreenRoute(route),
    )
    const screens = new Set(screenRoutes().map((route) => route.path))

    for (const addon of addons) {
      if (!addon.nav) continue
      const redirect = redirects.find((route) => route.path === addon.nav?.to)
      const landing = redirect?.redirect ?? addon.nav.to
      expect(screens, `${addon.name} nav points nowhere`).toContain(landing)
    }
  })

  it('keeps only live write labels in writes', () => {
    for (const route of screenRoutes()) {
      const writes = route.writes ?? []
      expect(new Set(writes).size).toBe(writes.length)
      for (const label of writes) expect(label.trim()).not.toBe('')
    }
  })

  it('puts sign-in outside the shell and everything else inside it', () => {
    const [root] = routeObjects(addons)
    const children = root.children ?? []
    const bare = children.filter((route) => route.path !== undefined)
    const shell = children.find((route) => route.path === undefined)

    expect(bare.map((route) => route.path)).toEqual(['/'])
    expect(shell?.children?.at(-1)?.path).toBe('*')
    expect(shell?.children?.map((route: RouteObject) => route.path)).toContain('/home')
  })
})
