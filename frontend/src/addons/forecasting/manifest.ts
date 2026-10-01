import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'forecasting',
  depends: ['base', 'sales', 'inventory'],
  screens: ['S-05'],
}
