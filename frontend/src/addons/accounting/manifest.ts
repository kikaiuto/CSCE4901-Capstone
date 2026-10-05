import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'accounting',
  depends: ['base'],
  screens: ['S-07', 'S-10', 'S-13'],
  nav: {
    label: 'Accounting',
    icon: 'accounting',
    to: '/accounting',
    group: 'operations',
    sequence: 50,
    area: 'Accounting',
  },
}
