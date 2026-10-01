import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChartCard, type ChartDataTable } from './ChartCard'
import type { SeriesMeta } from './ChartLegend'

const SERIES: SeriesMeta[] = [
  { key: 'current', label: 'This period', color: '#fff', shape: 'bar' },
  { key: 'previous', label: 'Previous', color: '#888', shape: 'dashed' },
]

const TABLE: ChartDataTable = {
  caption: 'Revenue by month',
  categoryLabel: 'Month',
  categories: ['Apr', 'May'],
  rows: [
    { key: 'current', label: 'This period', values: ['38,200', '41,500'] },
    { key: 'previous', label: 'Previous', values: ['35,100', '36,400'] },
  ],
}

function renderCard(series: SeriesMeta[] = SERIES) {
  return render(
    <ChartCard
      title="Revenue"
      description="Revenue by month, compared with the previous period"
      series={series}
      table={TABLE}
    >
      <div>chart</div>
    </ChartCard>,
  )
}

describe('ChartCard', () => {
  it('describes the chart region for assistive technology', () => {
    renderCard()

    expect(
      screen.getByRole('img', { name: 'Revenue by month, compared with the previous period' }),
    ).toBeInTheDocument()
  })

  it('carries the same numbers in a table, not only in the picture', () => {
    renderCard()

    const table = screen.getByRole('table', { name: 'Revenue by month' })

    expect(within(table).getByRole('columnheader', { name: 'Month' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: 'Apr' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '38,200' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '36,400' })).toBeInTheDocument()
  })

  it('shows a legend whenever there are two or more series', () => {
    renderCard()

    const legend = screen.getByRole('list', { name: 'Chart series' })

    expect(within(legend).getByText('This period')).toBeInTheDocument()
    expect(within(legend).getByText('Previous')).toBeInTheDocument()
  })

  it('omits the legend for a single series, where colour carries nothing', () => {
    renderCard([SERIES[0]])

    expect(screen.queryByRole('list', { name: 'Chart series' })).not.toBeInTheDocument()
  })
})
