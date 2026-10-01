import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/core/app/AppShell'
import { Placeholder } from '@/core/app/Placeholder'
import { SignInScreen } from '@/addons/base/screens/SignInScreen'
import { TodayScreen } from '@/addons/home/screens/TodayScreen'
import { OrdersScreen } from '@/addons/sales/screens/OrdersScreen'

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
        element: <Placeholder module="Inventory" screens={['S-05 Product and stock ledger']} />,
        handle: { crumb: 'Products', view: 'list' },
      },
      { path: '/procurement', element: <Navigate to="/procurement/orders" replace /> },
      {
        path: '/procurement/orders',
        element: <Placeholder module="Procurement" screens={['S-06 Receive purchase order']} />,
        handle: { crumb: 'Purchase orders', view: 'list' },
      },
      { path: '/accounting', element: <Navigate to="/accounting/journal" replace /> },
      {
        path: '/accounting/journal',
        element: <Placeholder module="Accounting" screens={['S-07 Journal entry']} />,
        handle: { crumb: 'Journal', view: 'record' },
      },
      {
        path: '/accounting/reports/profit-loss',
        element: <Placeholder module="Accounting" screens={['S-10 Profit and loss report']} />,
        handle: { crumb: 'Profit and loss', view: 'report' },
      },
      { path: '/admin', element: <Navigate to="/admin/people" replace /> },
      {
        path: '/admin/people',
        element: <Placeholder module="Admin" screens={['S-09 People and roles']} />,
        handle: { crumb: 'People and roles', view: 'list' },
      },
      { path: '*', element: <Navigate to="/home" replace /> },
    ],
  },
])
