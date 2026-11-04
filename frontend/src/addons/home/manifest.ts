import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'home',
  depends: ['base'],
  screens: ['S-02'],
  routes: [
    {
      id: 'home.today',
      path: '/home',
      crumb: 'Today',
      load: () => import('./screens/TodayScreen').then((m) => m.TodayScreen),
    },
  ],
  nav: {
    label: 'Home',
    icon: 'home',
    to: '/home',
    group: 'primary',
    sequence: 10,
  },
}
