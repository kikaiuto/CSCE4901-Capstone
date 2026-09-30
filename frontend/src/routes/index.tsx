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
      { path: '/home', element: <TodayScreen /> },
      { path: '/sales', element: <Navigate to="/sales/orders" replace /> },
      { path: '/sales/orders', element: <OrdersScreen /> },
      {
        path: '/inventory',
        element: (
          <Placeholder
            module="Inventory"
            screens={['S-05 Product and stock ledger']}
          />
        ),
      },
      {
        path: '/procurement',
        element: <Placeholder module="Procurement" screens={['S-06 Receive purchase order']} />,
      },
      {
        path: '/accounting',
        element: (
          <Placeholder
            module="Accounting"
            screens={['S-07 Journal entry', 'S-10 Profit and loss report']}
          />
        ),
      },
      {
        path: '/admin',
        element: <Placeholder module="Admin" screens={['S-09 People and roles']} />,
      },
      { path: '*', element: <Navigate to="/home" replace /> },
    ],
  },
])
