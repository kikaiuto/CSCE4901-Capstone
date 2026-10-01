import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'procurement',
  label: 'Procurement',
  icon: 'procurement',
  to: '/procurement',
  group: 'operations',
  sequence: 40,
  screens: ['S-06'],
}
