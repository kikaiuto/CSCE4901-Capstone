import type { AddonManifest } from '@/core/app/manifest'
import { customerCrumb } from './fixtures/customers'

export const manifest: AddonManifest = {
  name: 'sales',
  depends: ['base', 'inventory', 'accounting'],
  screens: ['S-03', 'S-04', 'S-11', 'S-12'],
  routes: [
    { path: '/sales', redirect: '/sales/orders' },
    {
      id: 'sales.orders',
      path: '/sales/orders',
      crumb: 'Orders',
      view: 'list',
      load: () => import('./screens/OrdersScreen').then((m) => m.OrdersScreen),
    },
    {
      id: 'sales.order',
      path: '/sales/orders/:number',
      crumb: (params) => params.number ?? '',
      view: 'record',
      example: '/sales/orders/SO-1044',
      load: () => import('./screens/OrderScreen').then((m) => m.OrderScreen),
    },
    {
      id: 'sales.customers',
      path: '/sales/customers',
      crumb: 'Customers',
      view: 'list',
      load: () => import('./screens/CustomersScreen').then((m) => m.CustomersScreen),
    },
    {
      id: 'sales.customer',
      path: '/sales/customers/:id',
      crumb: customerCrumb,
      view: 'record',
      example: '/sales/customers/cus-riverside',
      load: () => import('./screens/CustomerScreen').then((m) => m.CustomerScreen),
    },
  ],
  nav: {
    label: 'Sales',
    icon: 'sales',
    to: '/sales',
    group: 'operations',
    sequence: 20,
    area: 'Sales',
  },
}
