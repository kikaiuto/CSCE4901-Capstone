import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { currentUser, organization } from '@/addons/base/fixtures/org'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('links to home, the four modules and admin', () => {
    renderWithRouter(<Sidebar onOpenCommandBar={vi.fn()} />)

    for (const label of ['Home', 'Sales', 'Inventory', 'Procurement', 'Accounting', 'Admin']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('has no Ask destination, since the assistant lives in the command bar', () => {
    renderWithRouter(<Sidebar onOpenCommandBar={vi.fn()} />)

    expect(screen.queryByRole('link', { name: 'Ask' })).not.toBeInTheDocument()
  })

  it('leads with the organization rather than a product wordmark', () => {
    renderWithRouter(<Sidebar onOpenCommandBar={vi.fn()} />)

    expect(screen.getByText(organization.name)).toBeInTheDocument()
    expect(screen.queryByText('Sector 7')).not.toBeInTheDocument()
    expect(screen.queryByText('S7')).not.toBeInTheDocument()
  })

  it('groups the four operational modules under a heading', () => {
    renderWithRouter(<Sidebar onOpenCommandBar={vi.fn()} />)

    expect(screen.getByRole('navigation', { name: 'Operations' })).toBeInTheDocument()
  })

  it('keeps Admin and Home out of the operations group', () => {
    renderWithRouter(<Sidebar onOpenCommandBar={vi.fn()} />)

    const operations = screen.getByRole('navigation', { name: 'Operations' })

    expect(operations).not.toContainElement(screen.getByRole('link', { name: 'Admin' }))
    expect(operations).not.toContainElement(screen.getByRole('link', { name: 'Home' }))
    expect(operations).toContainElement(screen.getByRole('link', { name: 'Sales' }))
  })

  it('marks the current route as active', () => {
    renderWithRouter(<Sidebar onOpenCommandBar={vi.fn()} />, { path: '/sales' })

    expect(screen.getByRole('link', { name: 'Sales' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('opens the command bar from the search button', async () => {
    const onOpenCommandBar = vi.fn()
    renderWithRouter(<Sidebar onOpenCommandBar={onOpenCommandBar} />)

    await userEvent.click(screen.getByRole('button', { name: /Search/ }))

    expect(onOpenCommandBar).toHaveBeenCalledOnce()
  })

  it('shows who is signed in', () => {
    renderWithRouter(<Sidebar onOpenCommandBar={vi.fn()} />)

    expect(screen.getByText(currentUser.name)).toBeInTheDocument()
  })
})
