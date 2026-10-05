export type ReportCadence = 'month' | 'quarter'

export interface PeriodFigures {
  label: string
  revenue: number
  cogs: number
  opex: number
  netMargin: number
  [series: string]: string | number
}

export interface StatementRow {
  id: string
  label: string
  emphasis?: boolean
  values: string[]
}

export const periods: Record<ReportCadence, PeriodFigures[]> = {
  month: [
    { label: 'Apr', revenue: 38200, cogs: 25100, opex: 8000, netMargin: 13.4 },
    { label: 'May', revenue: 41500, cogs: 27000, opex: 8400, netMargin: 14.7 },
    { label: 'Jun', revenue: 39800, cogs: 26400, opex: 8100, netMargin: 13.3 },
    { label: 'Jul', revenue: 44100, cogs: 28900, opex: 8900, netMargin: 14.3 },
    { label: 'Aug', revenue: 43000, cogs: 28300, opex: 8600, netMargin: 14.2 },
    { label: 'Sep', revenue: 48200, cogs: 31700, opex: 9200, netMargin: 15.1 },
  ],
  quarter: [
    { label: 'Q1', revenue: 112400, cogs: 74200, opex: 23800, netMargin: 12.8 },
    { label: 'Q2', revenue: 119500, cogs: 78500, opex: 24500, netMargin: 13.8 },
    { label: 'Q3', revenue: 135300, cogs: 88900, opex: 26700, netMargin: 14.6 },
  ],
}

export const headline = {
  revenue: '254800.00',
  cogs: '167400.00',
  opex: '51200.00',
  netIncome: '36200.00',
  revenueChange: '9.6',
  cogsChange: '8.1',
  opexChange: '3.4',
  netIncomeChange: '22.0',
}

export const statement: StatementRow[] = [
  { id: 'revenue', label: 'Revenue', emphasis: true, values: ['38200.00', '41500.00', '39800.00', '44100.00', '43000.00', '48200.00'] },
  { id: 'cogs', label: 'Cost of goods sold', values: ['25100.00', '27000.00', '26400.00', '28900.00', '28300.00', '31700.00'] },
  { id: 'gross', label: 'Gross profit', emphasis: true, values: ['13100.00', '14500.00', '13400.00', '15200.00', '14700.00', '16500.00'] },
  { id: 'opex', label: 'Operating expenses', values: ['8000.00', '8400.00', '8100.00', '8900.00', '8600.00', '9200.00'] },
  { id: 'net', label: 'Net income', emphasis: true, values: ['5100.00', '6100.00', '5300.00', '6300.00', '6100.00', '7300.00'] },
]

export const statementColumns = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026']

export const receivablesAging = {
  total: '12940.00',
  buckets: [
    { key: 'current', label: 'Current', value: '7420.00', share: 57 },
    { key: '1-30', label: '1–30 days', value: '3180.00', share: 25 },
    { key: '31-60', label: '31–60 days', value: '1640.00', share: 13 },
    { key: '60-plus', label: '60+ days', value: '700.00', share: 5 },
  ],
  overdue: 2,
}
