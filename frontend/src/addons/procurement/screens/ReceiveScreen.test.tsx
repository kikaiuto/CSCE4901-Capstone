import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { ReceiveScreen } from './ReceiveScreen'

function renderReceive() {
  return renderWithRouter(<ReceiveScreen />, {
    path: '/procurement/orders/PO-0214',
    routePath: '/procurement/orders/:id',
  })
}

describe('ReceiveScreen', () => {
  it('shows the order, supplier and terms', () => {
    renderReceive()

    expect(screen.getByRole('heading', { name: 'PO-0214' })).toBeInTheDocument()
    expect(screen.getByText('Northstar Parts')).toBeInTheDocument()
    expect(screen.getByText('Net 30 · FOB origin')).toBeInTheDocument()
  })

  it('previews the journal entry the receipt would post', () => {
    renderReceive()

    const bar = screen.getByRole('region', { name: 'Primary action' })

    expect(bar).toHaveTextContent('Inventory Dr')
    expect(bar).toHaveTextContent('Accounts Payable Cr')
  })

  it('counts the received quantity into the primary action', () => {
    renderReceive()

    expect(screen.getByRole('button', { name: /Receive 70 items/ })).toBeInTheDocument()
  })

  it('updates that count as quantities change', async () => {
    const user = userEvent.setup()
    renderReceive()

    await user.click(screen.getByRole('button', { name: 'Increase Quantity received for GK-300' }))

    expect(screen.getByRole('button', { name: /Receive 71 items/ })).toBeInTheDocument()
  })

  it('never lets a line exceed what was ordered', async () => {
    const user = userEvent.setup()
    renderReceive()

    const increase = screen.getByRole('button', { name: 'Increase Quantity received for WA-100' })
    await user.click(increase)

    expect(screen.getByLabelText('Quantity received for WA-100')).toHaveValue('50')
  })

  it('leaves the receipt itself unwired', () => {
    renderReceive()

    expect(screen.getByRole('button', { name: /Receive 70 items/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
