import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { SectionNav } from '@/core/components/ui/SectionNav'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { countOf } from '@/core/lib/text'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { accountTypes } from '../fixtures/accounts'
import { useAccounts } from '../hooks/useJournal'
import { ACCOUNTING_SECTIONS } from '../sections'

export function AccountsScreen() {
  const fresh = useFirstVisit('accounting/accounts')
  const accounts = useAccounts()

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-5xl pb-16')}>
      <PageHeader
        title="Chart of accounts"
        meta={
          !accounts.loading && (
            <span className="text-base text-ink-muted">
              {countOf(accounts.items.length, 'account')} across {accountTypes.length} types
            </span>
          )
        }
        actions={
          <>
            <Button unwired>Export</Button>
            <Button variant="primary" shortcut="N" unwired>
              New account
            </Button>
          </>
        }
      />

      <SectionNav label="Accounting sections" items={ACCOUNTING_SECTIONS} className="mt-5" />

      {accounts.error && (
        <p role="alert" className="mt-6 text-base text-negative">
          {accounts.error}
        </p>
      )}

      {accounts.loading && (
        <p role="status" className="mt-6 text-base text-ink-muted">
          Loading accounts…
        </p>
      )}

      {!accounts.loading && !accounts.error && accounts.items.length === 0 && (
        <EmptyState
          title="No accounts yet"
          detail="The chart of accounts is empty for this organization."
        />
      )}

      {!accounts.loading && accounts.items.length > 0 && (
        <Table className="mt-7">
          <ColumnHeaders>
            <Th className="w-24 pl-3">Code</Th>
            <Th className="pr-3">Account</Th>
          </ColumnHeaders>

          <TBody>
            {accountTypes.flatMap((type) => [
              <tr key={type.id} className="border-t border-line first:border-t-0">
                <th scope="colgroup" className="pt-7 pb-2 pl-3 text-left">
                  <span className="section-label">{type.label}</span>
                </th>
                <td className="pt-7 pb-2 pr-3 text-right text-micro text-ink-faint">
                  Normal balance: {type.normal}
                </td>
              </tr>,
              ...accounts.items
                .filter((account) => account.account_type === type.id)
                .map((account) => (
                  <Tr key={account.account_id}>
                    <Td className="pl-3">
                      <span className="figure">{account.account_code}</span>
                    </Td>
                    <Td className="pr-3">{account.account_name}</Td>
                  </Tr>
                )),
            ])}
          </TBody>
        </Table>
      )}
    </div>
  )
}
