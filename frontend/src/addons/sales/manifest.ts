import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'sales',
  depends: ['base', 'inventory', 'accounting'],
  screens: ['S-03', 'S-04'],
  nav: {
    label: 'Sales',
    icon: 'sales',
    to: '/sales',
    group: 'operations',
    sequence: 20,
  },
}
