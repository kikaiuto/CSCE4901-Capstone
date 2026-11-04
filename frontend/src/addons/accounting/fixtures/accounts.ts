import type { AccountResponse } from './journal'

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

export const accountTypes: { id: AccountType; label: string; normal: string }[] = [
  { id: 'asset', label: 'Assets', normal: 'Debit' },
  { id: 'liability', label: 'Liabilities', normal: 'Credit' },
  { id: 'equity', label: 'Equity', normal: 'Credit' },
  { id: 'revenue', label: 'Revenue', normal: 'Credit' },
  { id: 'expense', label: 'Expenses', normal: 'Debit' },
]

export const demoAccounts: AccountResponse[] = [
  { account_id: 'a-1000', account_code: '1000', account_name: 'Cash', account_type: 'asset' },
  { account_id: 'a-1200', account_code: '1200', account_name: 'Accounts receivable', account_type: 'asset' },
  { account_id: 'a-2000', account_code: '2000', account_name: 'Accounts payable', account_type: 'liability' },
  { account_id: 'a-3000', account_code: '3000', account_name: "Owner's equity", account_type: 'equity' },
  { account_id: 'a-4000', account_code: '4000', account_name: 'Sales revenue', account_type: 'revenue' },
  { account_id: 'a-5000', account_code: '5000', account_name: 'Cost of goods sold', account_type: 'expense' },
  { account_id: 'a-6100', account_code: '6100', account_name: 'Rent', account_type: 'expense' },
]
