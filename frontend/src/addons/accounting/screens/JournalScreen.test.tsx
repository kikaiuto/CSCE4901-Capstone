import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch } from '@/core/test/fetch'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { accounts, recentEntries } from '../fixtures/journal'
import { JournalScreen } from './JournalScreen'

const fetchMock = mockFetch()

const posts = () =>
  fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')

function serve(post: () => Response) {
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input)
    if (init?.method === 'POST') return post()
    if (url.includes('/accounts')) return jsonResponse(accounts)
    return jsonResponse(recentEntries)
  })
}

async function fill(user: ReturnType<typeof userEvent.setup>, d1: string, c2: string) {
  await screen.findAllByRole('option', { name: '1300 · Inventory' })
  await user.selectOptions(screen.getByLabelText('Account, line 1'), 'acc-1300')
  await user.selectOptions(screen.getByLabelText('Account, line 2'), 'acc-2000')
  await user.type(screen.getByLabelText('Debit, line 1'), d1)
  await user.type(screen.getByLabelText('Credit, line 2'), c2)
}

describe('JournalScreen', () => {
  it('loads accounts and recent entries from the API', async () => {
    serve(() => jsonResponse({}))
    renderWithRouter(<JournalScreen />)

    expect(await screen.findByText('Rent, September')).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: '2000 · Accounts payable' })).toHaveLength(2)
  })

  it('meters debits against credits without float error', async () => {
    serve(() => jsonResponse({}))
    const user = userEvent.setup()
    renderWithRouter(<JournalScreen />)
    await fill(user, '0.10', '0.30')

    expect(screen.getByText(/Off by/)).toHaveTextContent('0.20')
  })

  it('posts a balanced entry without client totals, then clears and refreshes', async () => {
    serve(() => jsonResponse({ entry_id: 'je-9', status: 'POSTED' }, 201))
    const user = userEvent.setup()
    renderWithRouter(<JournalScreen />)
    await fill(user, '19.99', '19.99')
    await user.type(screen.getByLabelText('Memo'), 'Rent')
    await user.click(screen.getByRole('button', { name: 'Post entry' }))

    await waitFor(() => expect(posts()).toHaveLength(1))
    const body = JSON.parse(String(posts()[0][1]?.body))
    expect(body.memo).toBe('Rent')
    expect(body.lines).toEqual([
      { account_id: 'acc-1300', debit: '19.99', credit: '0.00' },
      { account_id: 'acc-2000', debit: '0.00', credit: '19.99' },
    ])
    expect(JSON.stringify(body)).not.toMatch(/total/)
    await waitFor(() => expect(screen.getByLabelText('Memo')).toHaveValue(''))
    expect(screen.getByLabelText('Debit, line 1')).toHaveValue('')
  })

  it('shows the 422 message and marks the offending lines', async () => {
    serve(() =>
      jsonResponse(
        {
          error: 'unbalanced_entry',
          message: 'Debits and credits differ',
          details: {
            total_debits: '5.00',
            total_credits: '4.00',
            difference: '1.00',
            line_errors: [{ index: 1, problem: 'too_precise' }],
          },
        },
        422,
      ),
    )
    const user = userEvent.setup()
    renderWithRouter(<JournalScreen />)
    await fill(user, '5.00', '4.005')
    await user.click(screen.getByRole('button', { name: 'Post entry' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Debits and credits differ')
    expect(screen.getByText('Use at most two decimal places')).toBeInTheDocument()
    expect(screen.getByLabelText('Credit, line 2')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Debit, line 1')).not.toHaveAttribute('aria-invalid')
    expect(within(screen.getByLabelText('Credit, line 2').closest('tr')!).getByText(/two decimal/)).toBeVisible()
  })
})
