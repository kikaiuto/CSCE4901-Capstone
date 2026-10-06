import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '@/core/test/renderWithRouter'
import { ProfitLossScreen } from './ProfitLossScreen'

describe('ProfitLossScreen', () => {
  it('leads with the four headline figures', () => {
    renderWithRouter(<ProfitLossScreen />)

    for (const label of ['Revenue', 'Cost of goods', 'Operating expenses', 'Net income']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(screen.getByText('$254,800')).toBeInTheDocument()
  })

  it('resolves the wireframe dual axis into two charts under one card', () => {
    const { container } = renderWithRouter(<ProfitLossScreen />)

    expect(container.querySelectorAll('.recharts-bar').length).toBe(3)
    expect(container.querySelectorAll('.recharts-line').length).toBe(1)
  })

  it('never draws a second y-axis', () => {
    const { container } = renderWithRouter(<ProfitLossScreen />)

    for (const chart of container.querySelectorAll('.recharts-wrapper')) {
      expect(chart.querySelectorAll('.recharts-yAxis').length).toBeLessThanOrEqual(1)
    }
  })

  it('highlights the margin line when the bars are hovered', async () => {
    const { container } = renderWithRouter(<ProfitLossScreen />)
    const [bars] = container.querySelectorAll('.recharts-wrapper')

    expect(container.querySelector('.recharts-reference-dot')).not.toBeInTheDocument()

    fireEvent.mouseMove(bars, { clientX: 200, clientY: 100 })

    await waitFor(() => {
      expect(container.querySelector('.recharts-reference-dot')).toBeInTheDocument()
    })
    expect(screen.getByRole('status')).toHaveTextContent(/net margin/)

    fireEvent.mouseLeave(bars)

    await waitFor(() => {
      expect(container.querySelector('.recharts-reference-dot')).not.toBeInTheDocument()
    })
  })

  it('names every series in the legend, so colour carries nothing alone', () => {
    renderWithRouter(<ProfitLossScreen />)

    const legend = screen.getByRole('list', { name: 'Chart series' })

    for (const label of ['Revenue', 'Cost of goods', 'Operating exp.', 'Net margin %']) {
      expect(within(legend).getByText(label)).toBeInTheDocument()
    }
  })

  it('carries the chart numbers in a table as well as a picture', () => {
    renderWithRouter(<ProfitLossScreen />)

    const table = screen.getByRole('table', {
      name: 'Revenue, cost, operating expenses and net margin by period',
    })

    expect(within(table).getByRole('rowheader', { name: 'Apr' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '15.1%' })).toBeInTheDocument()
  })

  it('switches the period cadence', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ProfitLossScreen />)

    await user.click(screen.getByRole('button', { name: 'Quarter' }))

    const table = screen.getByRole('table', {
      name: 'Revenue, cost, operating expenses and net margin by period',
    })
    expect(within(table).getByRole('rowheader', { name: 'Q3' })).toBeInTheDocument()
  })

  it('leaves export and the reminder action unwired', () => {
    renderWithRouter(<ProfitLossScreen />)

    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /Send reminders/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
