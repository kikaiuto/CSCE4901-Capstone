export type Cadence = 'W' | 'M' | 'Q'

export interface RevenuePoint {
  label: string
  current: number
  previous: number
  orders: number
}

export interface RevenueSeries {
  total: string
  change: string
  average: string
  points: RevenuePoint[]
}

export const revenue: Record<Cadence, RevenueSeries> = {
  W: {
    total: '127800',
    change: '15.2',
    average: '10700',
    points: [
      { label: 'Jul 7', current: 8100, previous: 7600, orders: 9 },
      { label: 'Jul 14', current: 9000, previous: 7900, orders: 11 },
      { label: 'Jul 21', current: 7800, previous: 8200, orders: 8 },
      { label: 'Jul 28', current: 9400, previous: 8400, orders: 12 },
      { label: 'Aug 4', current: 10600, previous: 9100, orders: 13 },
      { label: 'Aug 11', current: 11200, previous: 9600, orders: 12 },
      { label: 'Aug 18', current: 10400, previous: 9900, orders: 11 },
      { label: 'Aug 25', current: 11800, previous: 10200, orders: 14 },
      { label: 'Sep 1', current: 11400, previous: 10400, orders: 13 },
      { label: 'Sep 8', current: 12800, previous: 10200, orders: 14 },
      { label: 'Sep 15', current: 11900, previous: 10800, orders: 13 },
      { label: 'Sep 22', current: 13400, previous: 11100, orders: 15 },
    ],
  },
  M: {
    total: '127800',
    change: '11.8',
    average: '42600',
    points: [
      { label: 'Jul', current: 38200, previous: 34900, orders: 48 },
      { label: 'Aug', current: 41500, previous: 37800, orders: 52 },
      { label: 'Sep', current: 48100, previous: 41600, orders: 59 },
    ],
  },
  Q: {
    total: '254800',
    change: '9.6',
    average: '84900',
    points: [
      { label: 'Q1', current: 71400, previous: 66200, orders: 91 },
      { label: 'Q2', current: 84600, previous: 74800, orders: 108 },
      { label: 'Q3', current: 98800, previous: 86300, orders: 124 },
    ],
  },
}

export interface PulseMetric {
  label: string
  value: string
  kind: 'percent' | 'decimal' | 'quantity'
  delta?: string
}

export const pulse: PulseMetric[] = [
  { label: 'Gross margin', value: '34.2', kind: 'percent', delta: '1.1' },
  { label: 'Open orders', value: '23', kind: 'quantity' },
  { label: 'Receivables', value: '12940', kind: 'decimal', delta: '-2.3' },
  { label: 'Payables', value: '8315', kind: 'decimal' },
]

export const note =
  'Revenue is up 15% on the previous 12 weeks, led by Widget A. It will stock out before PO-0214 arrives.'
