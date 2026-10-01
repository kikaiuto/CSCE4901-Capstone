import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComparisonBars, type ComparisonPoint } from './ComparisonBars'
import type { SeriesMeta } from './ChartLegend'

const SERIES: SeriesMeta[] = [
  { key: 'revenue', label: 'Revenue', color: '#e6e6ec' },
  { key: 'cogs', label: 'Cost of goods', color: '#9a9aa6' },
]

const DATA: ComparisonPoint[] = [
  { label: 'Apr', revenue: 38200, cogs: 25100 },
  { label: 'May', revenue: 41500, cogs: 27000 },
]

describe('ComparisonBars', () => {
  it('draws into a measurable container under jsdom', () => {
    const { container } = render(
      <div style={{ width: 800, height: 400 }}>
        <ComparisonBars data={DATA} series={SERIES} format={String} />
      </div>,
    )

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders one bar series per declared series', () => {
    const { container } = render(
      <div style={{ width: 800, height: 400 }}>
        <ComparisonBars data={DATA} series={SERIES} format={String} />
      </div>,
    )

    expect(container.querySelectorAll('.recharts-bar')).toHaveLength(SERIES.length)
  })

  it('draws a single y-axis, never a second one', () => {
    const { container } = render(
      <div style={{ width: 800, height: 400 }}>
        <ComparisonBars data={DATA} series={SERIES} format={String} />
      </div>,
    )

    expect(container.querySelectorAll('.recharts-yAxis')).toHaveLength(1)
  })
})
