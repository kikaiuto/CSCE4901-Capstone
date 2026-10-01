import { screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter, type RenderWithRouterOptions } from '@/core/test/renderWithRouter'
import { JournalScreen } from '@/addons/accounting/screens/JournalScreen'
import { ProfitLossScreen } from '@/addons/accounting/screens/ProfitLossScreen'
import { PeopleScreen } from '@/addons/base/screens/PeopleScreen'
import { SignInScreen } from '@/addons/base/screens/SignInScreen'
import { TodayScreen } from '@/addons/home/screens/TodayScreen'
import { ProductScreen } from '@/addons/inventory/screens/ProductScreen'
import { ProductsScreen } from '@/addons/inventory/screens/ProductsScreen'
import { PurchaseOrdersScreen } from '@/addons/procurement/screens/PurchaseOrdersScreen'
import { ReceiveScreen } from '@/addons/procurement/screens/ReceiveScreen'
import { OrdersScreen } from '@/addons/sales/screens/OrdersScreen'

const WRITES =
  /^(Confirm|Receive|Post|Export|Invite|Remove|Resend|Adjust|Reorder|Cancel|Draft PO|Save draft|Open as draft|New |\+ Add line|\+ Filter|Send reminders|Forgot password|Create an organization)/

const SCREENS: { name: string; element: ReactElement; options?: RenderWithRouterOptions }[] = [
  { name: 'SignInScreen', element: <SignInScreen /> },
  {
    name: 'TodayScreen',
    element: <TodayScreen />,
    options: { outletContext: { openCommandBar: () => {} } },
  },
  { name: 'OrdersScreen', element: <OrdersScreen /> },
  { name: 'ProductsScreen', element: <ProductsScreen /> },
  {
    name: 'ProductScreen',
    element: <ProductScreen />,
    options: { path: '/inventory/products/WA-100', routePath: '/inventory/products/:sku' },
  },
  { name: 'PurchaseOrdersScreen', element: <PurchaseOrdersScreen /> },
  {
    name: 'ReceiveScreen',
    element: <ReceiveScreen />,
    options: { path: '/procurement/orders/PO-0214', routePath: '/procurement/orders/:id' },
  },
  { name: 'JournalScreen', element: <JournalScreen /> },
  { name: 'ProfitLossScreen', element: <ProfitLossScreen /> },
  { name: 'PeopleScreen', element: <PeopleScreen /> },
]

describe('the unwired convention', () => {
  for (const { name, element, options } of SCREENS) {
    it(`leaves every write action inert on ${name}`, () => {
      renderWithRouter(element, options)

      const writes = screen
        .queryAllByRole('button')
        .filter((button) => WRITES.test(button.textContent?.replace(/^✕/, '').trim() ?? ''))

      expect(writes.length, `${name} exposes no write action to check`).toBeGreaterThan(0)

      for (const button of writes) {
        expect(
          button,
          `${name}: "${button.textContent}" writes data but is not marked unwired`,
        ).toHaveAttribute('aria-disabled', 'true')
        expect(button).toHaveAttribute('title', 'Not wired up yet')
      }
    })
  }
})
