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

export interface StatementEntry {
  id: string
  reference: string
  date: string
  memo: string
  amount: string
  source: 'auto' | 'manual'
}

export interface StatementDerivation {
  minuend: string
  subtrahend: string
}

export const statementPeriod = statementColumns[statementColumns.length - 1]

export const statementEntries: Record<string, StatementEntry[]> = {
  revenue: [
    { id: 'se-r1', reference: 'JE-0171', date: '2026-09-04', memo: 'Invoice SO-1040', amount: '12650.00', source: 'auto' },
    { id: 'se-r2', reference: 'JE-0175', date: '2026-09-10', memo: 'Invoice SO-1041', amount: '9870.00', source: 'auto' },
    { id: 'se-r3', reference: 'JE-0179', date: '2026-09-16', memo: 'Invoice SO-1042', amount: '15400.00', source: 'auto' },
    { id: 'se-r4', reference: 'JE-0183', date: '2026-09-21', memo: 'Invoice SO-1043', amount: '8800.00', source: 'auto' },
    { id: 'se-r5', reference: 'JE-0187', date: '2026-09-27', memo: 'Invoice SO-1039', amount: '1480.00', source: 'auto' },
  ],
  cogs: [
    { id: 'se-c1', reference: 'JE-0171', date: '2026-09-04', memo: 'Cost of goods SO-1040', amount: '8310.00', source: 'auto' },
    { id: 'se-c2', reference: 'JE-0175', date: '2026-09-10', memo: 'Cost of goods SO-1041', amount: '6490.00', source: 'auto' },
    { id: 'se-c3', reference: 'JE-0179', date: '2026-09-16', memo: 'Cost of goods SO-1042', amount: '10120.00', source: 'auto' },
    { id: 'se-c4', reference: 'JE-0183', date: '2026-09-21', memo: 'Cost of goods SO-1043', amount: '5820.00', source: 'auto' },
    { id: 'se-c5', reference: 'JE-0187', date: '2026-09-27', memo: 'Cost of goods SO-1039', amount: '960.00', source: 'auto' },
  ],
  opex: [
    { id: 'se-o1', reference: 'JE-0172', date: '2026-09-05', memo: 'Payroll, September', amount: '5600.00', source: 'manual' },
    { id: 'se-o2', reference: 'JE-0177', date: '2026-09-12', memo: 'Utilities, September', amount: '640.00', source: 'manual' },
    { id: 'se-o3', reference: 'JE-0181', date: '2026-09-18', memo: 'Software subscriptions', amount: '560.00', source: 'manual' },
    { id: 'se-o4', reference: 'JE-0186', date: '2026-09-25', memo: 'Rent, September', amount: '2400.00', source: 'manual' },
  ],
}

export const statementDerivations: Record<string, StatementDerivation> = {
  gross: { minuend: 'revenue', subtrahend: 'cogs' },
  net: { minuend: 'gross', subtrahend: 'opex' },
}

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
