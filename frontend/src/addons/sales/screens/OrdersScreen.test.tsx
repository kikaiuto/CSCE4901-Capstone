import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { salesOrders } from '@/addons/sales/fixtures/orders'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { OrdersScreen } from './OrdersScreen'

function bodyRows() {
  const [, ...rows] = screen.getAllByRole('row')
  return rows
}

describe('OrdersScreen', () => {
  it('lists every order when the All tab is active', () => {
    renderWithRouter(<OrdersScreen />)

    expect(bodyRows()).toHaveLength(salesOrders.length)
  })

  it('shows order numbers and totals in the wireframe format', () => {
    renderWithRouter(<OrdersScreen />)

    expect(screen.getByText('SO-1044')).toBeInTheDocument()
    expect(screen.getByText('2,140.00')).toBeInTheDocument()
  })

  it('filters the table down to drafts', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('tab', { name: /Draft/ }))

    expect(bodyRows()).toHaveLength(2)
    expect(screen.getByText('SO-1044')).toBeInTheDocument()
    expect(screen.queryByText('SO-1043')).not.toBeInTheDocument()
  })

  it('filters down to a single cancelled order', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('tab', { name: /Cancelled/ }))

    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText('SO-1038')).toBeInTheDocument()
  })

  it('returns to the full list when All is chosen again', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('tab', { name: /Draft/ }))
    await userEvent.click(screen.getByRole('tab', { name: /^All/ }))

    expect(bodyRows()).toHaveLength(salesOrders.length)
  })

  it('keeps the bulk bar hidden until a row is selected', () => {
    renderWithRouter(<OrdersScreen />)

    expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
  })

  it('raises the bulk bar when a row is selected', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select SO-1044' }))

    expect(screen.getByText(/selected/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm/ })).toBeInTheDocument()
  })

  it('counts multiple selected rows', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select SO-1044' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select SO-1036' }))

    const bar = screen.getByText(/selected/).closest('div') as HTMLElement
    expect(within(bar).getByText('2')).toBeInTheDocument()
  })

  it('selects every visible row from the header checkbox', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select every order' }))

    const bar = screen.getByText(/selected/).closest('div') as HTMLElement
    expect(within(bar).getByText(String(salesOrders.length))).toBeInTheDocument()
  })

  it('clears the selection from the bulk bar', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select SO-1044' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
  })

  it('marks the header checkbox mixed for a partial selection', async () => {
    renderWithRouter(<OrdersScreen />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select SO-1044' }))

    expect(screen.getByRole('checkbox', { name: 'Select every order' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    )
  })

  it('leaves the write actions visibly unwired', async () => {
    renderWithRouter(<OrdersScreen />)

    expect(screen.getByRole('button', { name: /New order/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('button', { name: /Export/ })).toHaveAttribute('aria-disabled', 'true')

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select SO-1044' }))
    expect(screen.getByRole('button', { name: /Confirm/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
