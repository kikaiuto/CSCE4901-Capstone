import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { commandActions, goToResults } from '@/mocks/ai'
import { renderWithRouter } from '@/test/renderWithRouter'
import { CommandBar } from './CommandBar'

describe('CommandBar', () => {
  it('renders nothing while closed', () => {
    renderWithRouter(<CommandBar open={false} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens as a labelled dialog', () => {
    renderWithRouter(<CommandBar open onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Command bar' })).toBeInTheDocument()
  })

  it('focuses the input so typing works immediately', () => {
    renderWithRouter(<CommandBar open onClose={vi.fn()} />)

    expect(screen.getByLabelText('Search or ask')).toHaveFocus()
  })

  it('lists commands and records to jump to', () => {
    renderWithRouter(<CommandBar open onClose={vi.fn()} />)

    expect(screen.getByText(commandActions[0].label)).toBeInTheDocument()
    expect(screen.getByText(goToResults[0].label)).toBeInTheDocument()
  })

  it('leaves the write commands unwired', () => {
    renderWithRouter(<CommandBar open onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /New purchase order/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('switches into ask mode as soon as something is typed', async () => {
    renderWithRouter(<CommandBar open onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Search or ask'), 'reorder')

    expect(screen.getByText('ASK')).toBeInTheDocument()
  })

  it('answers with the same panel the Ask page uses', async () => {
    renderWithRouter(<CommandBar open onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Search or ask'), 'reorder widget from northstar')
    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByText('read_product_stock')).toBeInTheDocument())
    expect(screen.getByText('Draft · not saved')).toBeInTheDocument()
  })

  it('closes on escape', async () => {
    const onClose = vi.fn()
    renderWithRouter(<CommandBar open onClose={onClose} />)

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    renderWithRouter(<CommandBar open onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close the command bar' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('navigates and closes when a record is chosen', async () => {
    const onClose = vi.fn()
    const { router } = renderWithRouter(<CommandBar open onClose={onClose} />, {
      extraRoutes: [{ path: '/inventory', element: <p>Inventory</p> }],
    })

    await userEvent.click(screen.getByRole('button', { name: /WA-100 · 4 on hand/ }))

    expect(onClose).toHaveBeenCalled()
    await waitFor(() => expect(router.state.location.pathname).toBe('/inventory'))
  })

  it('states the read-only rule in the footer', () => {
    renderWithRouter(<CommandBar open onClose={vi.fn()} />)

    expect(screen.getByText(/prepares drafts; you confirm them/)).toBeInTheDocument()
  })
})
