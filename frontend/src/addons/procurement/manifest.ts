import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'procurement',
  depends: ['base', 'inventory', 'accounting'],
  screens: ['S-06'],
  routes: [
    { path: '/procurement', redirect: '/procurement/orders' },
    {
      id: 'procurement.orders',
      path: '/procurement/orders',
      crumb: 'Purchase orders',
      view: 'list',
      load: () => import('./screens/PurchaseOrdersScreen').then((m) => m.PurchaseOrdersScreen),
    },
    {
      id: 'procurement.receive',
      path: '/procurement/orders/:id',
      crumb: (params) => params.id ?? '',
      view: 'record',
      example: '/procurement/orders/PO-0214',
      load: () => import('./screens/ReceiveScreen').then((m) => m.ReceiveScreen),
    },
  ],
  nav: {
    label: 'Procurement',
    icon: 'procurement',
    to: '/procurement',
    group: 'operations',
    sequence: 40,
    area: 'Procurement',
  },
}
