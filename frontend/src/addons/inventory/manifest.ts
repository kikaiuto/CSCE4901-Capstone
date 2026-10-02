import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'inventory',
  depends: ['base'],
  screens: ['S-05'],
  nav: {
    label: 'Inventory',
    icon: 'inventory',
    to: '/inventory',
    group: 'operations',
    sequence: 30,
    area: 'Inventory',
  },
}
