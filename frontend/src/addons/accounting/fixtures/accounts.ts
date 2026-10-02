export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  balance: string
  entries: number
}

export const accountTypes: { id: AccountType; label: string; normal: string }[] = [
  { id: 'asset', label: 'Assets', normal: 'Debit' },
  { id: 'liability', label: 'Liabilities', normal: 'Credit' },
  { id: 'equity', label: 'Equity', normal: 'Credit' },
  { id: 'revenue', label: 'Revenue', normal: 'Credit' },
  { id: 'expense', label: 'Expenses', normal: 'Debit' },
]

export const chartOfAccounts: Account[] = [
  { id: 'a-1000', code: '1000', name: 'Cash', type: 'asset', balance: '42180.00', entries: 86 },
  { id: 'a-1200', code: '1200', name: 'Accounts receivable', type: 'asset', balance: '12940.00', entries: 64 },
  { id: 'a-1300', code: '1300', name: 'Inventory', type: 'asset', balance: '31620.40', entries: 112 },
  { id: 'a-1500', code: '1500', name: 'Equipment', type: 'asset', balance: '8400.00', entries: 4 },
  { id: 'a-2000', code: '2000', name: 'Accounts payable', type: 'liability', balance: '8315.00', entries: 47 },
  { id: 'a-2200', code: '2200', name: 'Sales tax payable', type: 'liability', balance: '1240.60', entries: 18 },
  { id: 'a-3000', code: '3000', name: "Owner's equity", type: 'equity', balance: '50000.00', entries: 2 },
  { id: 'a-3100', code: '3100', name: 'Retained earnings', type: 'equity', balance: '27585.80', entries: 9 },
  { id: 'a-4000', code: '4000', name: 'Sales revenue', type: 'revenue', balance: '254800.00', entries: 148 },
  { id: 'a-4100', code: '4100', name: 'Shipping income', type: 'revenue', balance: '3420.00', entries: 31 },
  { id: 'a-5000', code: '5000', name: 'Cost of goods sold', type: 'expense', balance: '167400.00', entries: 148 },
  { id: 'a-6000', code: '6000', name: 'Operating expenses', type: 'expense', balance: '51200.00', entries: 72 },
  { id: 'a-6100', code: '6100', name: 'Rent', type: 'expense', balance: '21600.00', entries: 12 },
]

export const accountTotals = {
  count: chartOfAccounts.length,
  types: accountTypes.length,
}
