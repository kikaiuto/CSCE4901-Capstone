import type { IconName } from '@/core/components/ui/Icon'

export type NavGroup = 'primary' | 'operations' | 'admin'

export interface NavEntry {
  label: string
  icon: IconName
  to: string
  group: NavGroup
  sequence: number
}

export interface AddonManifest {
  name: string
  depends: string[]
  screens: string[]
  nav?: NavEntry
}
