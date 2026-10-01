import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'home',
  depends: ['base'],
  screens: ['S-02'],
  nav: {
    label: 'Home',
    icon: 'home',
    to: '/home',
    group: 'primary',
    sequence: 10,
  },
}
