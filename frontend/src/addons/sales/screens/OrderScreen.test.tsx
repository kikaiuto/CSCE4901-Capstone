import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { OrderScreen } from './OrderScreen'

function renderOrder(number = 'SO-1044') {
  return renderWithRouter(<OrderScreen />, {
    path: `/sales/orders/${number}`,
    routePath: '/sales/orders/:number',
  })
}

describe('OrderScreen', () => {
  it('lays the order out as a document with its status stamp', () => {
    renderOrder()

    expect(screen.getByRole('heading', { name: 'SO-1044' })).toBeInTheDocument()
    expect(screen.getByLabelText('Status Draft')).toBeInTheDocument()
    expect(screen.getByText('Riverside Hardware')).toBeInTheDocument()
    expect(screen.getByText('Jamie Lee')).toBeInTheDocument()
  })

  it('shows every line with server-computed totals', () => {
    renderOrder()

    expect(screen.getByText('Widget A')).toBeInTheDocument()
    expect(screen.getByText('Box Kit')).toBeInTheDocument()
    expect(screen.getByText('Subtotal').parentElement).toHaveTextContent('317.50')
    expect(screen.getByText('Total USD').parentElement).toHaveTextContent('317.50')
  })

  it('names the stock shortage on the line that has it', () => {
    renderOrder()

    expect(screen.getByText('Only 4 available · short 6')).toBeInTheDocument()
  })

  it('previews every side effect before it happens', () => {
    renderOrder()

    const steps = screen.getByRole('list')

    expect(steps).toHaveTextContent('Reserve stock')
    expect(steps).toHaveTextContent('AR Dr 317.50 / Revenue Cr 317.50')
    expect(steps).toHaveTextContent('COGS Dr 182.60 / Inventory Cr 182.60')
  })

  it('surfaces the blocking problem and its fix in the action bar', () => {
    renderOrder()

    const bar = screen.getByRole('region', { name: 'Primary action' })

    expect(bar).toHaveTextContent('Widget A is short 6 units.')
    expect(bar).toHaveTextContent('Split into backorder')
  })

  it('leaves the action bar clean for an order with no problems', () => {
    renderOrder('SO-1036')

    const bar = screen.getByRole('region', { name: 'Primary action' })

    expect(bar).not.toHaveTextContent('short')
    expect(screen.getByRole('heading', { name: 'SO-1036' })).toBeInTheDocument()
  })

  it('falls back to an empty state for an unknown order', () => {
    renderOrder('SO-9999')

    expect(screen.getByText('No such order')).toBeInTheDocument()
  })
})
