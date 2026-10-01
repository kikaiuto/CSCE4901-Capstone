import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { ROLES } from '../fixtures/org'
import { people } from '../fixtures/people'
import { PeopleScreen } from './PeopleScreen'

describe('PeopleScreen', () => {
  it('lists everyone in the organization', () => {
    renderWithRouter(<PeopleScreen />)

    for (const person of people) {
      expect(screen.getByText(person.name)).toBeInTheDocument()
    }
  })

  it('covers all six roles the requirements name, not four', () => {
    renderWithRouter(<PeopleScreen />)

    expect(ROLES).toHaveLength(6)

    for (const role of ROLES) {
      expect(screen.getAllByText(role).length).toBeGreaterThan(0)
    }
  })

  it('marks an invited person as invited', () => {
    renderWithRouter(<PeopleScreen />)

    expect(screen.getByText('invited')).toBeInTheDocument()
  })

  it('describes each access cell in words, not only a glyph', () => {
    renderWithRouter(<PeopleScreen />)

    expect(screen.getByLabelText('Sales, Accounting: No access')).toBeInTheDocument()
    expect(screen.getByLabelText('Owner, Admin: Full access')).toBeInTheDocument()
    expect(screen.getByLabelText('Sales, Inventory: View only')).toBeInTheDocument()
  })

  it('leaves every write action unwired', () => {
    renderWithRouter(<PeopleScreen />)

    for (const name of ['Invite person', 'Remove']) {
      const [control] = screen.getAllByRole('button', { name })
      expect(control).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('offers Resend only for people who have not accepted', () => {
    renderWithRouter(<PeopleScreen />)

    const resend = screen.getAllByRole('button', { name: 'Resend' })
    const invited = people.filter((person) => person.status === 'invited')

    expect(resend).toHaveLength(invited.length)
  })

  it('shows the access legend so a glyph never stands alone', () => {
    const { container } = renderWithRouter(<PeopleScreen />)

    expect(within(container).getByText('Full access')).toBeInTheDocument()
    expect(within(container).getByText('View only')).toBeInTheDocument()
    expect(within(container).getByText('No access')).toBeInTheDocument()
  })
})
