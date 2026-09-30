import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('shows the sidebar', () => {
    renderWithRouter(<AppShell />)

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('keeps the command bar closed until it is asked for', () => {
    renderWithRouter(<AppShell />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the command bar with the meta K shortcut', async () => {
    renderWithRouter(<AppShell />)

    await userEvent.keyboard('{Meta>}k{/Meta}')

    expect(screen.getByRole('dialog', { name: 'Command bar' })).toBeInTheDocument()
  })

  it('opens the command bar with the control K shortcut', async () => {
    renderWithRouter(<AppShell />)

    await userEvent.keyboard('{Control>}k{/Control}')

    expect(screen.getByRole('dialog', { name: 'Command bar' })).toBeInTheDocument()
  })

  it('toggles the command bar closed with the same shortcut', async () => {
    renderWithRouter(<AppShell />)

    await userEvent.keyboard('{Meta>}k{/Meta}')
    await userEvent.keyboard('{Meta>}k{/Meta}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the command bar from the sidebar search button', async () => {
    renderWithRouter(<AppShell />)

    await userEvent.click(screen.getByRole('button', { name: /Search/ }))

    expect(screen.getByRole('dialog', { name: 'Command bar' })).toBeInTheDocument()
  })
})
