import type { OverlayRow, ScreenOverlay } from '@/core/app/overlays'
import { forecastSeries, type ForecastWindow } from '../fixtures/forecast'

function rowsFor(range: string): OverlayRow[] {
  const points = forecastSeries[range as ForecastWindow] ?? []

  return points.map((point) => ({
    label: point.label,
    projected: point.projected,
    band: [point.lower, point.upper] as [number, number],
  }))
}

export const forecastContribution: ScreenOverlay = {
  screen: 'S-05',
  owner: 'forecasting',
  spec: {
    valueKey: 'projected',
    bandKey: 'band',
    color: 'var(--color-chart-highlight)',
    bandColor: 'var(--color-chart-highlight)',
  },
  rows: rowsFor,
  risk: { from: 'Sep 24', to: 'Sep 30' },
}
