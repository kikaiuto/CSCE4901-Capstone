import type { IconName } from '@/core/components/ui/Icon'

export type NavGroup = 'primary' | 'operations' | 'admin'

export interface AddonManifest {
  name: string
  label: string
  icon: IconName
  to: string
  group: NavGroup
  sequence: number
  screens: string[]
}
