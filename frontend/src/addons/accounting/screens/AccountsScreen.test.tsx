import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch } from '@/core/test/fetch'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { accountTypes, demoAccounts } from '../fixtures/accounts'
import { AccountsScreen } from './AccountsScreen'

const fetchMock = mockFetch()

beforeEach(() => {
  fetchMock.mockResolvedValue(jsonResponse(demoAccounts))
})

describe('AccountsScreen', () => {
  it('groups the accounts under the five standard types in one table', async () => {
    renderWithRouter(<AccountsScreen />)

    await screen.findByText('Cash')
    for (const type of accountTypes) {
      expect(screen.getByText(type.label)).toBeInTheDocument()
    }

    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getAllByRole('columnheader', { name: 'Code' })).toHaveLength(1)
  })

  it('names the normal balance for each type', async () => {
    renderWithRouter(<AccountsScreen />)

    await screen.findByText('Cash')
    expect(screen.getAllByText('Normal balance: Debit')).toHaveLength(2)
    expect(screen.getAllByText('Normal balance: Credit')).toHaveLength(3)
  })

  it('shows every account the API returns with its code', async () => {
    renderWithRouter(<AccountsScreen />)

    await screen.findByText('Cash')
    const rows = screen
      .getAllByRole('row')
      .filter((row) => within(row).queryAllByRole('cell').length === 2)

    expect(rows).toHaveLength(demoAccounts.length)
    expect(screen.getByText('Accounts receivable')).toBeInTheDocument()
    expect(screen.getByText('1200')).toBeInTheDocument()
    expect(screen.getByText('7 accounts across 5 types')).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/accounting/accounts')
  })

  it('says what went wrong when the list cannot load', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'forbidden', message: 'Your role cannot see the chart', details: {} }, 403),
    )
    renderWithRouter(<AccountsScreen />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Your role cannot see the chart')
  })

  it('offers the rest of the accounting module', () => {
    renderWithRouter(<AccountsScreen />)

    const nav = screen.getByRole('navigation', { name: 'Accounting sections' })

    expect(within(nav).getByRole('link', { name: 'Journal' })).toHaveAttribute(
      'href',
      '/accounting/journal',
    )
    expect(within(nav).getByRole('link', { name: 'Profit and loss' })).toHaveAttribute(
      'href',
      '/accounting/reports/profit-loss',
    )
  })

  it('leaves the write actions unwired', () => {
    renderWithRouter(<AccountsScreen />)

    for (const name of [/^New account/, 'Export']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })
})
