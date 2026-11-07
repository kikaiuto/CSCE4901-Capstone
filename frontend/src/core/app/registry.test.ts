import { describe, expect, it } from 'vitest'
import { addons, allRoutes, moduleFor, navItems, operationLabels, railItems } from './registry'
import type { NavEntry } from './manifest'

describe('registry', () => {
  it('names every addon once', () => {
    const names = addons.map((addon) => addon.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('orders the rail by sequence', () => {
    const sequences = railItems().map((item) => item.sequence)
    expect(sequences).toEqual([...sequences].sort((a, b) => a - b))
  })

  it('gives every nav destination a route', () => {
    const paths = allRoutes().map((route) => route.path)
    const nav = addons
      .map((addon) => addon.nav)
      .filter((entry): entry is NavEntry => entry !== undefined)

    for (const entry of nav) {
      expect(paths, `no route for ${entry.to}`).toContain(entry.to)
    }
  })

  it('tags every route with the addon that contributed it', () => {
    for (const route of allRoutes()) {
      expect(addons.map((addon) => addon.name)).toContain(route.owner)
    }
  })

  it('keeps Home and Admin out of the operations group', () => {
    expect(operationLabels).toEqual(['Sales', 'Inventory', 'Procurement', 'Accounting'])
    expect(navItems('primary').map((addon) => addon.label)).toEqual(['Home'])
    expect(navItems('admin').map((addon) => addon.label)).toEqual(['Admin'])
  })

  it('leaves Admin off the rail body', () => {
    expect(railItems().some((item) => item.group === 'admin')).toBe(false)
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
