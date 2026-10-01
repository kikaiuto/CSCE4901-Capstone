export type ChartColorKey = 'current' | 'previous' | 'third' | 'highlight' | 'grid'

export const chartColor: Record<ChartColorKey, string> = {
  current: 'var(--color-chart-current)',
  previous: 'var(--color-chart-previous)',
  third: 'var(--color-chart-third)',
  highlight: 'var(--color-chart-highlight)',
  grid: 'var(--color-chart-grid)',
}

export const CHART_MARGIN = { top: 12, right: 8, bottom: 4, left: 8 } as const

export const axisTick = {
  fill: 'var(--color-ink-muted)',
  fontSize: 10,
} as const

export const gridProps = {
  stroke: chartColor.grid,
  strokeDasharray: '0',
  vertical: false,
} as const

export function niceMax(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1

  const magnitude = 10 ** Math.floor(Math.log10(max))
  const step = magnitude / 2

  return Math.ceil(max / step) * step
}

export function niceTicks(max: number, count = 4): number[] {
  const top = niceMax(max)
  return Array.from({ length: count }, (_, index) => (top / (count - 1)) * index)
}
