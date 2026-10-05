import type { SectionNavItem } from '@/core/components/ui/SectionNav'

export const ACCOUNTING_SECTIONS: SectionNavItem[] = [
  { label: 'Journal', to: '/accounting/journal' },
  { label: 'Chart of accounts', to: '/accounting/accounts' },
  { label: 'Profit and loss', to: '/accounting/reports/profit-loss' },
]
