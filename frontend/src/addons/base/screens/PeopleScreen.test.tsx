import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { jsonResponse, mockFetch } from '@/core/test/fetch'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { ROLES } from '../fixtures/org'
import { demoUsers } from '../fixtures/people'
import { PeopleScreen } from './PeopleScreen'

const fetchMock = mockFetch()

beforeEach(() => {
  fetchMock.mockResolvedValue(jsonResponse(demoUsers))
})

describe('PeopleScreen', () => {
  it('lists everyone the API returns for the organization', async () => {
    renderWithRouter(<PeopleScreen />)

    for (const user of demoUsers) {
      expect(await screen.findByText(user.full_name ?? user.email)).toBeInTheDocument()
    }
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/base/users')
    expect(screen.getByText('6 people · 1 inactive')).toBeInTheDocument()
  })

  it('orders people by role, owner first', async () => {
    renderWithRouter(<PeopleScreen />)

    await screen.findByText('Dana Owens')
    const [, ...rows] = within(screen.getAllByRole('table')[0]).getAllByRole('row')
    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'Dana Owens',
      'Mo Ferrara',
      'Priya Raman',
      'Lee Carter',
      'Sam Oyelaran',
      'Ted Brill',
    ])
  })

  it('covers all six roles the requirements name, not four', async () => {
    renderWithRouter(<PeopleScreen />)

    await screen.findByText('Dana Owens')
    expect(ROLES).toHaveLength(6)
    for (const role of ROLES) {
      expect(screen.getAllByText(role).length).toBeGreaterThan(0)
    }
  })

  it('marks a deactivated person as inactive', async () => {
    renderWithRouter(<PeopleScreen />)

    expect(await screen.findByText('inactive')).toBeInTheDocument()
    expect(screen.getAllByText('active')).toHaveLength(5)
  })

  it('falls back to the email when a person has no name', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ ...demoUsers[0], full_name: '' }]))
    renderWithRouter(<PeopleScreen />)

    await waitFor(() => expect(screen.getAllByText('owner@northstar.demo')).toHaveLength(2))
  })

  it('describes each access cell in words, not only a glyph', () => {
    renderWithRouter(<PeopleScreen />)

    expect(screen.getByLabelText('Sales, Accounting: No access')).toBeInTheDocument()
    expect(screen.getByLabelText('Owner, Admin: Full access')).toBeInTheDocument()
    expect(screen.getByLabelText('Sales, Inventory: View only')).toBeInTheDocument()
  })

  it('leaves every write action unwired', async () => {
    renderWithRouter(<PeopleScreen />)

    await screen.findByText('Dana Owens')
    for (const name of ['Invite person', 'Remove']) {
      const [control] = screen.getAllByRole('button', { name })
      expect(control).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('says what went wrong when the list cannot load', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'forbidden', message: 'Only owners and admins see people', details: {} }, 403),
    )
    renderWithRouter(<PeopleScreen />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Only owners and admins see people')
  })

  it('shows the access legend so a glyph never stands alone', () => {
    const { container } = renderWithRouter(<PeopleScreen />)

    expect(within(container).getByText('Full access')).toBeInTheDocument()
    expect(within(container).getByText('View only')).toBeInTheDocument()
    expect(within(container).getByText('No access')).toBeInTheDocument()
  })
})
