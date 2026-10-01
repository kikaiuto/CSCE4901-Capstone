import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'sales',
  label: 'Sales',
  icon: 'sales',
  to: '/sales',
  group: 'operations',
  sequence: 20,
  screens: ['S-03', 'S-04'],
}
