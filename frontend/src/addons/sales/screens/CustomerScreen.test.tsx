import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { CustomerScreen } from './CustomerScreen'

function renderCustomer(id = 'cus-riverside') {
  return renderWithRouter(<CustomerScreen />, {
    path: `/sales/customers/${id}`,
    routePath: '/sales/customers/:id',
  })
}

describe('CustomerScreen', () => {
  it('heads the record with the customer and its credit standing', () => {
    renderCustomer()

    expect(screen.getByRole('heading', { name: 'Riverside Hardware' })).toBeInTheDocument()
    expect(screen.getByText('Dale Whitford')).toBeInTheDocument()
    expect(screen.getByText('good standing')).toBeInTheDocument()
  })

  it('shows the four headline figures', () => {
    renderCustomer()

    for (const label of ['Open orders', 'Receivables', 'Lifetime value', 'Average order']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('links each open document back to its order', () => {
    renderCustomer()

    expect(screen.getByRole('link', { name: 'SO-1044' })).toHaveAttribute(
      'href',
      '/sales/orders/SO-1044',
    )
  })

  it('renders the order history as an accessible table beside the chart', () => {
    renderCustomer()

    const table = screen.getByRole('table', {
      name: 'Monthly order value for Riverside Hardware',
    })

    expect(table).toBeInTheDocument()
    expect(table).toHaveTextContent('Sep')
  })

  it('falls back to an empty state for an unknown customer', () => {
    renderCustomer('cus-nobody')

    expect(screen.getByText('No such customer')).toBeInTheDocument()
  })
})
