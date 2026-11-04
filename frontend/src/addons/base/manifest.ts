import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'base',
  depends: [],
  screens: ['S-01', 'S-09'],
  routes: [
    {
      id: 'base.sign-in',
      path: '/',
      layout: 'bare',
      load: () => import('./screens/SignInScreen').then((m) => m.SignInScreen),
    },
    { path: '/admin', redirect: '/admin/people' },
    {
      id: 'base.people',
      path: '/admin/people',
      crumb: 'People and roles',
      view: 'list',
      load: () => import('./screens/PeopleScreen').then((m) => m.PeopleScreen),
    },
  ],
  nav: {
    label: 'Admin',
    icon: 'people',
    to: '/admin',
    group: 'admin',
    sequence: 60,
    area: 'Admin',
  },
}
