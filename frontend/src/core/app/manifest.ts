import type { IconName } from '@/core/components/ui/Icon'

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

export interface AddonManifest {
  name: string
  depends: string[]
  screens: string[]
  nav?: NavEntry
}
