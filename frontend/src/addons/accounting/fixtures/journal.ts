export interface JournalLine {
  id: string
  account: string
  debit: string
  credit: string
}

export interface RecentEntry {
  id: string
  reference: string
  date: string
  memo: string
  amount: string
  source: 'auto' | 'manual'
}

export const accounts = [
  '1000 · Cash',
  '1200 · Accounts receivable',
  '1300 · Inventory',
  '2000 · Accounts payable',
  '4000 · Sales revenue',
  '5000 · Cost of goods sold',
  '6000 · Operating expenses',
]

export const draftLines: JournalLine[] = [
  { id: 'jl-1', account: '1300 · Inventory', debit: '2000.00', credit: '0.00' },
  { id: 'jl-2', account: '2000 · Accounts payable', debit: '0.00', credit: '1900.00' },
]

export const recentEntries: RecentEntry[] = [
  { id: 'je-1', reference: 'JE-0188', date: '2026-09-28', memo: 'Receipt PO-0212', amount: '2310.75', source: 'auto' },
  { id: 'je-2', reference: 'JE-0187', date: '2026-09-27', memo: 'Invoice SO-1039', amount: '1480.00', source: 'auto' },
  { id: 'je-3', reference: 'JE-0186', date: '2026-09-25', memo: 'Rent, September', amount: '2400.00', source: 'manual' },
  { id: 'je-4', reference: 'JE-0185', date: '2026-09-22', memo: 'Stock adjustment ADJ-0042', amount: '23.68', source: 'manual' },
]
