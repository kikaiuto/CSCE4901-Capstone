import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { revenue } from '@/mocks/metrics'
import { RevenueChart } from './RevenueChart'

function renderChart(onCadenceChange = vi.fn()) {
  render(
    <RevenueChart
      series={revenue.W}
      cadence="W"
      onCadenceChange={onCadenceChange}
      periodLabel="12 weeks"
    />,
  )
  return onCadenceChange
}

describe('RevenueChart', () => {
  it('shows the period total and its change', () => {
    renderChart()

    expect(screen.getByText('$127,800')).toBeInTheDocument()
    expect(screen.getByText('+15.2%')).toBeInTheDocument()
  })

  it('colours a positive change green', () => {
    renderChart()

    expect(screen.getByText('+15.2%')).toHaveClass('text-positive')
  })

  it('describes itself for screen readers', () => {
    renderChart()

    expect(
      screen.getByRole('img', { name: /Revenue by 12 weeks, compared with the previous period/ }),
    ).toBeInTheDocument()
  })

  it('legends both series so identity is never colour alone', () => {
    renderChart()

    expect(screen.getByText('This period')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
  })

  it('draws one bar per data point', () => {
    const { container } = render(
      <RevenueChart
        series={revenue.W}
        cadence="W"
        onCadenceChange={vi.fn()}
        periodLabel="12 weeks"
      />,
    )

    expect(container.querySelectorAll('path')).toHaveLength(revenue.W.points.length)
  })

  it('marks the current cadence as pressed', () => {
    renderChart()

    expect(screen.getByRole('button', { name: 'W' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Q' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports a cadence change', async () => {
    const onCadenceChange = renderChart()

    await userEvent.click(screen.getByRole('button', { name: 'Q' }))

    expect(onCadenceChange).toHaveBeenCalledWith('Q')
  })

  it('shows no tooltip until a point is hovered', () => {
    renderChart()

    expect(screen.queryByText(/Week of/)).not.toBeInTheDocument()
  })

  it('names the hovered week and its comparison in a tooltip', async () => {
    const { container } = render(
      <RevenueChart
        series={revenue.W}
        cadence="W"
        onCadenceChange={vi.fn()}
        periodLabel="12 weeks"
      />,
    )

    const hitAreas = container.querySelectorAll('rect')
    await userEvent.hover(hitAreas[9])

    expect(screen.getByText('Week of Sep 8')).toBeInTheDocument()
    expect(screen.getByText('12.8K')).toBeInTheDocument()
    expect(screen.getByText('10.2K')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('hides the tooltip again when the pointer leaves', async () => {
    const { container } = render(
      <RevenueChart
        series={revenue.W}
        cadence="W"
        onCadenceChange={vi.fn()}
        periodLabel="12 weeks"
      />,
    )

    const hitAreas = container.querySelectorAll('rect')
    await userEvent.hover(hitAreas[9])
    await userEvent.unhover(hitAreas[9])

    expect(screen.queryByText('Week of Sep 8')).not.toBeInTheDocument()
  })
})
