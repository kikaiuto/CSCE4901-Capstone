export type StockWindow = '30D' | '60D' | '90D'

export interface StockPoint {
  label: string
  onHand: number
}

export interface LedgerEntry {
  id: string
  date: string
  source: string
  change: string
  balance: string
}

export interface OpenDocument {
  id: string
  document: string
  party: string
  expected: string
  quantity: string
  status: 'submitted' | 'draft'
  action: string
}

export const stockSeries: Record<StockWindow, StockPoint[]> = {
  '30D': [
    { label: 'Sep 1', onHand: 20 },
    { label: 'Sep 5', onHand: 20 },
    { label: 'Sep 12', onHand: 58 },
    { label: 'Sep 18', onHand: 56 },
    { label: 'Sep 20', onHand: 10 },
    { label: 'Sep 24', onHand: 4 },
    { label: 'Sep 30', onHand: 4 },
  ],
  '60D': [
    { label: 'Aug 15', onHand: 41 },
    { label: 'Aug 22', onHand: 29 },
    { label: 'Sep 1', onHand: 20 },
    { label: 'Sep 8', onHand: 8 },
    { label: 'Sep 12', onHand: 58 },
    { label: 'Sep 18', onHand: 56 },
    { label: 'Sep 20', onHand: 10 },
    { label: 'Sep 24', onHand: 4 },
    { label: 'Sep 30', onHand: 4 },
  ],
  '90D': [
    { label: 'Jul 5', onHand: 64 },
    { label: 'Jul 20', onHand: 52 },
    { label: 'Aug 5', onHand: 47 },
    { label: 'Aug 15', onHand: 41 },
    { label: 'Sep 1', onHand: 20 },
    { label: 'Sep 12', onHand: 58 },
    { label: 'Sep 20', onHand: 10 },
    { label: 'Sep 30', onHand: 4 },
  ],
}

export const todayLabel = 'Sep 30'

export const stockLedger: LedgerEntry[] = [
  { id: 'l-1', date: '09-24', source: 'SO-1039', change: '-6', balance: '4' },
  { id: 'l-2', date: '09-20', source: 'SO-1031', change: '-46', balance: '10' },
  { id: 'l-3', date: '09-18', source: 'ADJ-0042', change: '-2', balance: '56' },
  { id: 'l-4', date: '09-12', source: 'PO-0211', change: '+50', balance: '58' },
  { id: 'l-5', date: '09-05', source: 'SO-1024', change: '-12', balance: '8' },
]

export const openDocuments: OpenDocument[] = [
  {
    id: 'd-1',
    document: 'PO-0214',
    party: 'Northstar Parts',
    expected: '2026-09-28',
    quantity: '+50',
    status: 'submitted',
    action: 'Receive',
  },
  {
    id: 'd-2',
    document: 'SO-1044',
    party: 'Riverside Hardware',
    expected: '2026-09-25',
    quantity: '-10',
    status: 'draft',
    action: 'Review',
  },
]
