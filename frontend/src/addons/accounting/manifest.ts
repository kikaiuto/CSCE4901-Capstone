import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'accounting',
  depends: ['base'],
  screens: ['S-07', 'S-10', 'S-13'],
  routes: [
    { path: '/accounting', redirect: '/accounting/journal' },
    {
      id: 'accounting.journal',
      path: '/accounting/journal',
      crumb: 'Journal',
      view: 'record',
      writes: ['Post entry', '+ Add line'],
      load: () => import('./screens/JournalScreen').then((m) => m.JournalScreen),
    },
    {
      id: 'accounting.accounts',
      path: '/accounting/accounts',
      crumb: 'Chart of accounts',
      view: 'list',
      load: () => import('./screens/AccountsScreen').then((m) => m.AccountsScreen),
    },
    {
      id: 'accounting.profit-loss',
      path: '/accounting/reports/profit-loss',
      crumb: 'Profit and loss',
      view: 'report',
      load: () => import('./screens/ProfitLossScreen').then((m) => m.ProfitLossScreen),
    },
  ],
  nav: {
    label: 'Accounting',
    icon: 'accounting',
    to: '/accounting',
    group: 'operations',
    sequence: 50,
    area: 'Accounting',
  },
}
