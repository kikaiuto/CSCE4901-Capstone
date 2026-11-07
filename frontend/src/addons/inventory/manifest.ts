import type { AddonManifest } from '@/core/app/manifest'

export const manifest: AddonManifest = {
  name: 'inventory',
  depends: ['base', 'accounting'],
  screens: ['S-05'],
  routes: [
    { path: '/inventory', redirect: '/inventory/products' },
    {
      id: 'inventory.products',
      path: '/inventory/products',
      crumb: 'Products',
      view: 'list',
      writes: ['New product'],
      load: () => import('./screens/ProductsScreen').then((m) => m.ProductsScreen),
    },
    {
      id: 'inventory.product-new',
      path: '/inventory/products/new',
      crumb: 'New product',
      view: 'record',
      writes: ['Create product', 'Cancel'],
      load: () => import('./screens/ProductNewScreen').then((m) => m.ProductNewScreen),
    },
    {
      id: 'inventory.product',
      path: '/inventory/products/:sku',
      crumb: (params) => params.sku ?? '',
      view: 'record',
      example: '/inventory/products/WA-100',
      load: () => import('./screens/ProductScreen').then((m) => m.ProductScreen),
    },
  ],
  nav: {
    label: 'Inventory',
    icon: 'inventory',
    to: '/inventory',
    group: 'operations',
    sequence: 30,
    area: 'Inventory',
  },
}
