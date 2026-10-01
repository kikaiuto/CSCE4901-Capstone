import { describe, expect, it } from 'vitest'
import { router } from '@/routes'
import { addons, moduleFor, navItems, operationLabels, railItems } from './registry'

function routePaths(): string[] {
  const paths: string[] = []

  function walk(routes: { path?: string; children?: unknown[] }[]) {
    for (const route of routes) {
      if (route.path) paths.push(route.path)
      if (route.children) walk(route.children as { path?: string; children?: unknown[] }[])
    }
  }

  walk(router.routes as { path?: string; children?: unknown[] }[])
  return paths
}

describe('registry', () => {
  it('names every addon once', () => {
    const names = addons.map((addon) => addon.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('orders the rail by sequence', () => {
    const sequences = addons.map((addon) => addon.sequence)
    expect(sequences).toEqual([...sequences].sort((a, b) => a - b))
  })

  it('gives every nav destination a route', () => {
    const paths = routePaths()
    for (const addon of addons) {
      expect(paths, `${addon.name} has no route for ${addon.to}`).toContain(addon.to)
    }
  })

  it('keeps Home and Admin out of the operations group', () => {
    expect(operationLabels).toEqual(['Sales', 'Inventory', 'Procurement', 'Accounting'])
    expect(navItems('primary').map((addon) => addon.label)).toEqual(['Home'])
    expect(navItems('admin').map((addon) => addon.label)).toEqual(['Admin'])
  })

  it('leaves Admin off the rail body', () => {
    expect(railItems.some((addon) => addon.group === 'admin')).toBe(false)
  })

  it('resolves a nested path back to its module', () => {
    expect(moduleFor('/sales/orders')?.name).toBe('sales')
    expect(moduleFor('/inventory/products/WA-100')?.name).toBe('inventory')
    expect(moduleFor('/admin/people')?.name).toBe('base')
  })

  it('matches no module for a path outside the app', () => {
    expect(moduleFor('/')).toBeUndefined()
    expect(moduleFor('/salesforce')).toBeUndefined()
  })

  it('uses the word the ADR settled on', () => {
    expect(operationLabels).toContain('Procurement')
    expect(operationLabels).not.toContain('Purchasing')
  })
})
