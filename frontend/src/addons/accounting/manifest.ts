import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'accounting',
  label: 'Accounting',
  icon: 'accounting',
  to: '/accounting',
  group: 'operations',
  sequence: 50,
  screens: ['S-07', 'S-10'],
}
