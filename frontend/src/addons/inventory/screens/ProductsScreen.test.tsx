import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { products } from '../fixtures/products'
import { ProductsScreen } from './ProductsScreen'

function bodyRows() {
  const [, ...rows] = screen.getAllByRole('row')
  return rows
}

describe('ProductsScreen', () => {
  it('lists every product on the All tab', () => {
    renderWithRouter(<ProductsScreen />)

    expect(bodyRows()).toHaveLength(products.length)
  })

  it('filters down to the items below safety stock', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProductsScreen />)

    await user.click(screen.getByRole('tab', { name: /Below safety/ }))

    expect(bodyRows()).toHaveLength(products.filter((p) => p.state === 'low').length)
  })

  it('links each SKU through to its record', () => {
    renderWithRouter(<ProductsScreen />)

    expect(screen.getByRole('link', { name: 'WA-100' })).toHaveAttribute(
      'href',
      '/inventory/products/WA-100',
    )
  })

  it('shows a stock-out quantity as negative', () => {
    renderWithRouter(<ProductsScreen />)

    expect(screen.getByText('-12')).toBeInTheDocument()
  })

  it('leaves the write actions unwired', () => {
    renderWithRouter(<ProductsScreen />)

    for (const name of ['New product', 'Export']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })
})
