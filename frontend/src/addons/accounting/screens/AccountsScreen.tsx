import { Button } from '@/core/components/ui/Button'
import { Figure } from '@/core/components/ui/Figure'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { SectionNav } from '@/core/components/ui/SectionNav'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { countOf } from '@/core/lib/text'
import { accountTotals, accountTypes, chartOfAccounts } from '../fixtures/accounts'
import { ACCOUNTING_SECTIONS } from '../sections'

export function AccountsScreen() {
  const fresh = useFirstVisit('accounting/accounts')

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-5xl pb-16')}>
      <PageHeader
        title="Chart of accounts"
        meta={
          <span className="text-base text-ink-muted">
            {countOf(accountTotals.count, 'account')} across {accountTotals.types} types
          </span>
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

      <Table className="mt-7">
        <ColumnHeaders>
          <Th className="w-24 pl-3">Code</Th>
          <Th>Account</Th>
          <Th align="right">Entries</Th>
          <Th align="right" className="pr-3">
            Balance
          </Th>
        </ColumnHeaders>

        <TBody>
          {accountTypes.flatMap((type) => [
            <tr key={type.id} className="border-t border-line first:border-t-0">
              <th colSpan={2} scope="colgroup" className="pt-7 pb-2 pl-3 text-left">
                <span className="section-label">{type.label}</span>
              </th>
              <td colSpan={2} className="pt-7 pb-2 pr-3 text-right text-micro text-ink-faint">
                Normal balance: {type.normal}
              </td>
            </tr>,
            ...chartOfAccounts
              .filter((account) => account.type === type.id)
              .map((account) => (
                <Tr key={account.id}>
                  <Td className="pl-3">
                    <span className="figure">{account.code}</span>
                  </Td>
                  <Td>{account.name}</Td>
                  <Td align="right">
                    <Figure value={String(account.entries)} kind="quantity" tone="muted" />
                  </Td>
                  <Td align="right" className="pr-3">
                    <Figure value={account.balance} />
                  </Td>
                </Tr>
              )),
          ])}
        </TBody>
      </Table>
    </div>
  )
}
