import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { note } from '@/addons/home/fixtures/metrics'
import { queue, queueCount } from '@/addons/home/fixtures/queue'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { TodayScreen } from './TodayScreen'

function renderToday(openCommandBar = vi.fn()) {
  renderWithRouter(<TodayScreen />, { outletContext: { openCommandBar } })
  return openCommandBar
}

describe('TodayScreen', () => {
  it('leads with a greeting rather than a page title', () => {
    renderToday()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Dana/)
  })

  it('dates the page and says how much is waiting', () => {
    renderToday()

    expect(screen.getByText('Today · Friday, Sep 25')).toBeInTheDocument()
    expect(
      screen.getByText(`${queueCount} things need you. Nothing is overdue.`),
    ).toBeInTheDocument()
  })

  it('offers the ask line instead of an AI tab', () => {
    renderToday()

    expect(
      screen.getByRole('button', { name: /Ask about your stock, orders or books/ }),
    ).toBeInTheDocument()
  })

  it('opens the command bar from the ask line', async () => {
    const openCommandBar = renderToday()

    await userEvent.click(screen.getByRole('button', { name: /Ask about your stock/ }))

    expect(openCommandBar).toHaveBeenCalledOnce()
  })

  it('shows the headline metrics as a strip', () => {
    renderToday()

    expect(screen.getByText('Revenue · 12w')).toBeInTheDocument()
    expect(screen.getByText('$127,800')).toBeInTheDocument()
    expect(screen.getByText('34.2%')).toBeInTheDocument()
    expect(screen.getByText('12,940')).toBeInTheDocument()
  })

  it('signs the metric deltas', () => {
    renderToday()

    expect(screen.getByText('+15.2%')).toHaveClass('text-positive')
    expect(screen.getByText('-2.3%')).toHaveClass('text-negative')
  })

  it('shows the generated note', () => {
    renderToday()

    expect(screen.getByText(note)).toBeInTheDocument()
  })

  it('groups the queue by the action each row needs', () => {
    renderToday()

    for (const group of queue) {
      expect(screen.getByRole('heading', { level: 2, name: group.label })).toBeInTheDocument()
    }
  })

  it('gives every queue row its own action button', () => {
    renderToday()

    expect(screen.getByRole('button', { name: /Review/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Receive/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Draft PO/ })).toHaveLength(2)
  })

  it('shows an out of balance amount in the negative tone', () => {
    renderToday()

    expect(screen.getByText('-$100.00')).toHaveClass('text-negative')
  })

  it('leaves every queue action unwired', () => {
    renderToday()

    for (const name of [/Review/, /Confirm/, /Receive/, /Open/]) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })
})
