import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { ModuleBar } from './ModuleBar'

describe('ModuleBar', () => {
  it('opens the command bar from the search affordance', async () => {
    const onOpenCommandBar = vi.fn()
    renderWithRouter(<ModuleBar onOpenCommandBar={onOpenCommandBar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Search or ask' }))

    expect(onOpenCommandBar).toHaveBeenCalledOnce()
  })

  it('advertises the keyboard shortcut', () => {
    renderWithRouter(<ModuleBar onOpenCommandBar={vi.fn()} />)

    expect(screen.getByText('⌘K')).toBeInTheDocument()
  })

  it('renders no breadcrumb on a route that declares none', () => {
    renderWithRouter(<ModuleBar onOpenCommandBar={vi.fn()} />)

    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument()
  })

  it('shows the module and screen for a known route', () => {
    renderWithRouter(<ModuleBar onOpenCommandBar={vi.fn()} />, { path: '/sales/orders' })

    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(trail).toHaveTextContent('Sales')
  })

  it('places screen actions beside the search affordance', () => {
    renderWithRouter(
      <ModuleBar onOpenCommandBar={vi.fn()} actions={<button type="button">New order</button>} />,
    )

    expect(screen.getByRole('button', { name: 'New order' })).toBeInTheDocument()
  })
})
