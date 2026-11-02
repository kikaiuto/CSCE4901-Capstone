export interface AccountResponse {
  account_id: string
  account_code: string
  account_name: string
  account_type: string
}

export interface JournalEntrySummary {
  entry_id: string
  entry_date: string
  memo: string
  source: 'auto' | 'manual'
  total: string
  created_at: string
}

export const accounts: AccountResponse[] = [
  { account_id: 'acc-1300', account_code: '1300', account_name: 'Inventory', account_type: 'asset' },
  { account_id: 'acc-2000', account_code: '2000', account_name: 'Accounts payable', account_type: 'liability' },
  { account_id: 'acc-6000', account_code: '6000', account_name: 'Operating expenses', account_type: 'expense' },
]

export const recentEntries: JournalEntrySummary[] = [
  { entry_id: 'je-3', entry_date: '2026-09-25', memo: 'Rent, September', source: 'manual', total: '2400.00', created_at: '2026-09-25T10:00:00Z' },
  { entry_id: 'je-2', entry_date: '2026-09-27', memo: 'Invoice SO-1039', source: 'auto', total: '1480.00', created_at: '2026-09-27T10:00:00Z' },
]
