import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch } from '@/core/test/fetch'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { screenRoutes } from './registry'

const WRITES =
  /^(Confirm|Receive|Post|Export|Invite|Remove|Resend|Adjust|Reorder|Cancel|Draft PO|Save draft|Open as draft|New |Create |\+ Add line|\+ Add item|\+ Filter|Send reminders|Split into backorder|Forgot password|Create an organization)/

const fetchMock = mockFetch()

function labelOf(button: HTMLElement): string {
  return button.textContent?.replace(/^✕/, '').trim() ?? ''
}

describe('the unwired convention', () => {
  for (const route of screenRoutes()) {
    it(`leaves every write action inert on ${route.id}`, async () => {
      fetchMock.mockImplementation(async () => jsonResponse([]))
      const Component = await route.load()

      renderWithRouter(<Component />, {
        path: route.example ?? route.path,
        routePath: route.path,
        outletContext: { openCommandBar: () => {} },
      })

      const live = new Set(route.writes ?? [])
      const found = new Set<string>()
      const writes = screen.queryAllByRole('button').filter((button) => WRITES.test(labelOf(button)))

      expect(writes.length, `${route.id} exposes no write action to check`).toBeGreaterThan(0)

      for (const button of writes) {
        const label = labelOf(button)

        if (live.has(label)) {
          found.add(label)
          expect(button, `${route.id}: "${label}" is declared live but renders inert`).not.toHaveAttribute(
            'aria-disabled',
          )
          continue
        }

        expect(
          button,
          `${route.id}: "${label}" writes data but is not marked unwired`,
        ).toHaveAttribute('aria-disabled', 'true')
        expect(button).toHaveAttribute('title', 'Not wired up yet')
      }

      expect([...found].sort(), `${route.id} declares writes that are not on the screen`).toEqual(
        [...live].sort(),
      )
    })
  }
})
