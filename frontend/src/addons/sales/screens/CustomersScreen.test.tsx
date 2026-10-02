import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { customers } from '../fixtures/customers'
import { CustomersScreen } from './CustomersScreen'

function bodyRows() {
  const [, ...rows] = screen.getAllByRole('row')
  return rows
}

describe('CustomersScreen', () => {
  it('lists every customer on the All tab', () => {
    renderWithRouter(<CustomersScreen />)

    expect(bodyRows()).toHaveLength(customers.length)
  })

  it('links each customer through to its record', () => {
    renderWithRouter(<CustomersScreen />)

    expect(screen.getByRole('link', { name: 'Riverside Hardware' })).toHaveAttribute(
      'href',
      '/sales/customers/cus-riverside',
    )
  })

  it('filters down to customers on credit hold', async () => {
    renderWithRouter(<CustomersScreen />)

    await userEvent.click(screen.getByRole('tab', { name: /On hold/ }))

    const rows = bodyRows()
    expect(rows).toHaveLength(1)
    expect(within(rows[0]).getByRole('link', { name: 'Pine & Co.' })).toBeInTheDocument()
  })

  it('filters down to customers who owe money', async () => {
    renderWithRouter(<CustomersScreen />)

    await userEvent.click(screen.getByRole('tab', { name: /Owing/ }))

    expect(bodyRows()).toHaveLength(customers.filter((c) => Number(c.receivables) > 0).length)
  })

  it('crosses over to orders', () => {
    renderWithRouter(<CustomersScreen />)

    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/sales/orders')
  })
})
