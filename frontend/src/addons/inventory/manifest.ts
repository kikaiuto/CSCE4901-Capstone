import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'inventory',
  label: 'Inventory',
  icon: 'inventory',
  to: '/inventory',
  group: 'operations',
  sequence: 30,
  screens: ['S-05'],
}
