import type { ForecastPoint } from '../fixtures/forecast'

export interface OverlaySpec {
  valueKey: string
  bandKey: string
  color: string
  bandColor: string
}

export interface OverlayRow {
  label: string
  projected: number
  band: [number, number]
}

export function overlayRows(points: ForecastPoint[]): OverlayRow[] {
  return points.map((point) => ({
    label: point.label,
    projected: point.projected,
    band: [point.lower, point.upper],
  }))
}

export const forecastSpec: OverlaySpec = {
  valueKey: 'projected',
  bandKey: 'band',
  color: 'var(--color-chart-highlight)',
  bandColor: 'var(--color-chart-highlight)',
}
