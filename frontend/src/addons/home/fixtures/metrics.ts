export type MetricKind = 'decimal' | 'money' | 'percent' | 'quantity'

export interface Metric {
  label: string
  value: string
  kind: MetricKind
  places?: number
  delta?: string
  deltaKind?: MetricKind
}

export const metrics: Metric[] = [
  { label: 'Revenue · 12w', value: '127800', kind: 'money', places: 0, delta: '15.2', deltaKind: 'percent' },
  { label: 'Gross margin', value: '34.2', kind: 'percent', delta: '1.1', deltaKind: 'decimal' },
  { label: 'Open orders', value: '23', kind: 'quantity' },
  { label: 'Receivables', value: '12940', kind: 'decimal', places: 0, delta: '-2.3', deltaKind: 'percent' },
]

export const note =
  'Revenue is up 15% on the previous 12 weeks, led by Widget A. It will stock out before PO-0214 arrives.'
