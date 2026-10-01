import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/core/app/AppShell'
import { SignInScreen } from '@/addons/base/screens/SignInScreen'
import { TodayScreen } from '@/addons/home/screens/TodayScreen'
import { OrdersScreen } from '@/addons/sales/screens/OrdersScreen'
import { ProductsScreen } from '@/addons/inventory/screens/ProductsScreen'
import { PurchaseOrdersScreen } from '@/addons/procurement/screens/PurchaseOrdersScreen'
import { PeopleScreen } from '@/addons/base/screens/PeopleScreen'
import { ReceiveScreen } from '@/addons/procurement/screens/ReceiveScreen'
import { JournalScreen } from '@/addons/accounting/screens/JournalScreen'

export const router = createBrowserRouter([
  { path: '/', element: <SignInScreen /> },
  {
    element: <AppShell />,
    children: [
      {
        path: '/home',
        element: <TodayScreen />,
        handle: { crumb: 'Today' },
      },
      { path: '/sales', element: <Navigate to="/sales/orders" replace /> },
      {
        path: '/sales/orders',
        element: <OrdersScreen />,
        handle: { crumb: 'Orders', view: 'list' },
      },
      { path: '/inventory', element: <Navigate to="/inventory/products" replace /> },
      {
        path: '/inventory/products',
        element: <ProductsScreen />,
        handle: { crumb: 'Products', view: 'list' },
      },
      {
        path: '/inventory/products/:sku',
        lazy: async () => ({
          Component: (await import('@/addons/inventory/screens/ProductScreen')).ProductScreen,
        }),
        handle: { crumb: (params: { sku?: string }) => params.sku ?? '', view: 'record' },
      },
      { path: '/procurement', element: <Navigate to="/procurement/orders" replace /> },
      {
        path: '/procurement/orders',
        element: <PurchaseOrdersScreen />,
        handle: { crumb: 'Purchase orders', view: 'list' },
      },
      {
        path: '/procurement/orders/:id',
        element: <ReceiveScreen />,
        handle: { crumb: (params: { id?: string }) => params.id ?? '', view: 'record' },
      },
      { path: '/accounting', element: <Navigate to="/accounting/journal" replace /> },
      {
        path: '/accounting/journal',
        element: <JournalScreen />,
        handle: { crumb: 'Journal', view: 'record' },
      },
      {
        path: '/accounting/reports/profit-loss',
        lazy: async () => ({
          Component: (await import('@/addons/accounting/screens/ProfitLossScreen')).ProfitLossScreen,
        }),
        handle: { crumb: 'Profit and loss', view: 'report' },
      },
      { path: '/admin', element: <Navigate to="/admin/people" replace /> },
      {
        path: '/admin/people',
        element: <PeopleScreen />,
        handle: { crumb: 'People and roles', view: 'list' },
      },
      { path: '*', element: <Navigate to="/home" replace /> },
    ],
  },
])
