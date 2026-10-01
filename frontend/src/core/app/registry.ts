import type { AddonManifest, NavGroup } from './manifest'
import { manifest as accounting } from '@/addons/accounting/manifest'
import { manifest as base } from '@/addons/base/manifest'
import { manifest as home } from '@/addons/home/manifest'
import { manifest as inventory } from '@/addons/inventory/manifest'
import { manifest as procurement } from '@/addons/procurement/manifest'
import { manifest as sales } from '@/addons/sales/manifest'

export const addons: AddonManifest[] = [home, sales, inventory, procurement, accounting, base].sort(
  (a, b) => a.sequence - b.sequence,
)

export function navItems(group: NavGroup): AddonManifest[] {
  return addons.filter((addon) => addon.group === group)
}

export const railItems: AddonManifest[] = addons.filter((addon) => addon.group !== 'admin')

export function moduleFor(pathname: string): AddonManifest | undefined {
  return addons.find((addon) => pathname === addon.to || pathname.startsWith(`${addon.to}/`))
}

export const operationLabels: string[] = navItems('operations').map((addon) => addon.label)
