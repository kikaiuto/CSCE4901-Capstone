import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'home',
  label: 'Home',
  icon: 'home',
  to: '/home',
  group: 'primary',
  sequence: 10,
  screens: ['S-02'],
}
