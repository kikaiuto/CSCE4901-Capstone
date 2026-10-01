import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'base',
  label: 'Admin',
  icon: 'admin',
  to: '/admin',
  group: 'admin',
  sequence: 60,
  screens: ['S-01', 'S-09'],
}
