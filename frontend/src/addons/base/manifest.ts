import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'base',
  depends: [],
  screens: ['S-01', 'S-09'],
  nav: {
    label: 'Admin',
    icon: 'admin',
    to: '/admin',
    group: 'admin',
    sequence: 60,
  },
}
