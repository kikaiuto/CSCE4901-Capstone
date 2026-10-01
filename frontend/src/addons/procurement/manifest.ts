import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'procurement',
  depends: ['base', 'inventory', 'accounting'],
  screens: ['S-06'],
  nav: {
    label: 'Procurement',
    icon: 'procurement',
    to: '/procurement',
    group: 'operations',
    sequence: 40,
  },
}
