import type { AddonManifest, NavEntry, NavGroup } from './manifest'
import { manifest as accounting } from '@/addons/accounting/manifest'
import { manifest as ai } from '@/addons/ai/manifest'
import { manifest as base } from '@/addons/base/manifest'
import { manifest as forecasting } from '@/addons/forecasting/manifest'
import { manifest as home } from '@/addons/home/manifest'
import { manifest as inventory } from '@/addons/inventory/manifest'
import { manifest as procurement } from '@/addons/procurement/manifest'
import { manifest as sales } from '@/addons/sales/manifest'

export interface NavItem extends NavEntry {
  name: string
}

export const addons: AddonManifest[] = [
  accounting,
  ai,
  base,
  forecasting,
  home,
  inventory,
  procurement,
  sales,
]

export const addonsByName: Record<string, AddonManifest> = Object.fromEntries(
  addons.map((addon) => [addon.name, addon]),
)

const navEntries: NavItem[] = addons
  .filter((addon): addon is AddonManifest & { nav: NavEntry } => addon.nav !== undefined)
  .map((addon) => ({ name: addon.name, ...addon.nav }))
  .sort((a, b) => a.sequence - b.sequence)

export function navItems(group: NavGroup): NavItem[] {
  return navEntries.filter((item) => item.group === group)
}

export const railItems: NavItem[] = navEntries.filter((item) => item.group !== 'admin')

export function moduleFor(pathname: string): NavItem | undefined {
  return navEntries.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
}

export const operationLabels: string[] = navItems('operations').map((item) => item.label)
