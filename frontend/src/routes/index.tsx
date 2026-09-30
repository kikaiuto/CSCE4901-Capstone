import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { Placeholder } from '@/app/Placeholder'
import { SignInScreen } from '@/features/auth/SignInScreen'
import { TodayScreen } from '@/features/home/TodayScreen'
import { OrdersScreen } from '@/features/sales/OrdersScreen'

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
        path: '/purchasing',
        element: <Placeholder module="Purchasing" screens={['S-06 Receive purchase order']} />,
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
