import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'sales',
  depends: ['base', 'inventory', 'accounting'],
  screens: ['S-03', 'S-04', 'S-11', 'S-12'],
  nav: {
    label: 'Sales',
    icon: 'sales',
    to: '/sales',
    group: 'operations',
    sequence: 20,
    area: 'Sales',
  },
}
