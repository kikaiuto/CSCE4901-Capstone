import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { accountTypes, chartOfAccounts } from '../fixtures/accounts'
import { AccountsScreen } from './AccountsScreen'

describe('AccountsScreen', () => {
  it('groups the accounts under the five standard types in one table', () => {
    renderWithRouter(<AccountsScreen />)

    for (const type of accountTypes) {
      expect(screen.getByText(type.label)).toBeInTheDocument()
    }

    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.getAllByRole('columnheader', { name: 'Code' })).toHaveLength(1)
  })

  it('names the normal balance for each type', () => {
    renderWithRouter(<AccountsScreen />)

    expect(screen.getAllByText('Normal balance: Debit')).toHaveLength(2)
    expect(screen.getAllByText('Normal balance: Credit')).toHaveLength(3)
  })

  it('shows every account with its code and balance', () => {
    renderWithRouter(<AccountsScreen />)

    const rows = screen
      .getAllByRole('row')
      .filter((row) => within(row).queryAllByRole('cell').length === 4)

    expect(rows).toHaveLength(chartOfAccounts.length)
    expect(screen.getByText('Accounts receivable')).toBeInTheDocument()
    expect(screen.getByText('1200')).toBeInTheDocument()
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
})
