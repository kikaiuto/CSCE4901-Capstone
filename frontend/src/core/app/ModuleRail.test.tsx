import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { currentUser, organization } from '@/addons/base/fixtures/org'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { ModuleRail } from './ModuleRail'

describe('ModuleRail', () => {
  it('links to home, the four modules and admin', () => {
    renderWithRouter(<ModuleRail />)

    for (const label of ['Home', 'Sales', 'Inventory', 'Procurement', 'Accounting', 'Admin']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('has no Ask destination, since the assistant lives in the command bar', () => {
    renderWithRouter(<ModuleRail />)

    expect(screen.queryByRole('link', { name: 'Ask' })).not.toBeInTheDocument()
  })

  it('leads with the organization rather than a product wordmark', () => {
    renderWithRouter(<ModuleRail />)

    expect(screen.getByRole('button', { name: organization.name })).toBeInTheDocument()
    expect(screen.queryByText('Sector 7')).not.toBeInTheDocument()
    expect(screen.queryByText('S7')).not.toBeInTheDocument()
  })

  it('groups the four operational modules under a heading', () => {
    renderWithRouter(<ModuleRail />)

    expect(screen.getByRole('navigation', { name: 'Operations' })).toBeInTheDocument()
  })

  it('keeps Admin and Home out of the operations group', () => {
    renderWithRouter(<ModuleRail />)

    const operations = screen.getByRole('navigation', { name: 'Operations' })

    expect(operations).not.toContainElement(screen.getByRole('link', { name: 'Admin' }))
    expect(operations).not.toContainElement(screen.getByRole('link', { name: 'Home' }))
    expect(operations).toContainElement(screen.getByRole('link', { name: 'Sales' }))
  })

  it('marks the current route as active', () => {
    renderWithRouter(<ModuleRail />, { path: '/sales/orders' })

    expect(screen.getByRole('link', { name: 'Sales' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('shows who is signed in', () => {
    renderWithRouter(<ModuleRail />)

    expect(screen.getByRole('button', { name: currentUser.name })).toBeInTheDocument()
  })

  it('labels every destination, so no icon stands alone', () => {
    renderWithRouter(<ModuleRail />)

    for (const label of ['Home', 'Sales', 'Inventory', 'Procurement', 'Accounting']) {
      expect(screen.getByRole('link', { name: label })).toHaveTextContent(label)
    }
  })

  it('leaves the organization switcher unwired', () => {
    renderWithRouter(<ModuleRail />)

    expect(screen.getByRole('button', { name: organization.name })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('opens an account panel from the user avatar', async () => {
    renderWithRouter(<ModuleRail />)

    await userEvent.click(screen.getByRole('button', { name: currentUser.name }))

    const panel = screen.getByRole('dialog', { name: 'Account' })
    expect(panel).toHaveTextContent(currentUser.email)
    expect(panel).toHaveTextContent(currentUser.role)
    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveFocus()
  })

  it('closes the account panel with Escape', async () => {
    renderWithRouter(<ModuleRail />)

    await userEvent.click(screen.getByRole('button', { name: currentUser.name }))
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Account' })).not.toBeInTheDocument()
  })
})
