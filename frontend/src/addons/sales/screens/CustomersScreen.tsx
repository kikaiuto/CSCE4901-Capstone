import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Figure } from '@/core/components/ui/Figure'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { SelectShell } from '@/core/components/ui/Field'
import { SectionNav } from '@/core/components/ui/SectionNav'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { Tabs, type TabItem } from '@/core/components/ui/Tabs'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { countOf } from '@/core/lib/text'
import { customerTotals, customers } from '../fixtures/customers'
import { SALES_SECTIONS } from '../sections'

type Filter = 'all' | 'open' | 'owing' | 'hold'

const MATCHES: Record<Filter, (customer: (typeof customers)[number]) => boolean> = {
  all: () => true,
  open: (customer) => Number(customer.openOrders) > 0,
  owing: (customer) => Number(customer.receivables) > 0,
  hold: (customer) => customer.creditStatus === 'cancelled',
}

export function CustomersScreen() {
  const [filter, setFilter] = useState<Filter>('all')

  const tabs = useMemo<readonly TabItem<Filter>[]>(
    () => [
      { id: 'all', label: 'All', count: customers.length },
      { id: 'open', label: 'With open orders', count: customers.filter(MATCHES.open).length },
      { id: 'owing', label: 'Owing', count: customers.filter(MATCHES.owing).length },
      { id: 'hold', label: 'On hold', count: customers.filter(MATCHES.hold).length },
    ],
    [],
  )

  const rows = useMemo(() => customers.filter(MATCHES[filter]), [filter])
  const fresh = useFirstVisit('sales/customers')

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title="Customers"
        actions={
          <Button variant="primary" shortcut="N" unwired>
            New customer
          </Button>
        }
      />

      <SectionNav label="Sales sections" items={SALES_SECTIONS} className="mt-5" />

      <Tabs items={tabs} active={filter} onChange={setFilter} className="mt-6" />

      <div className="flex items-center gap-2.5 py-4">
        <SelectShell value="Terms" unwired />
        <SelectShell value="Owner" unwired />

        <div className="ml-auto flex items-center gap-3">
          <p className="text-base text-ink-muted">
            {countOf(customerTotals.count, 'customer')} ·{' '}
            <Figure value={customerTotals.receivables} kind="money" tone="muted" /> owed
          </p>
          <Button unwired>Export</Button>
        </div>
      </div>

      <Table>
        <ColumnHeaders>
          <Th className="pl-3">Customer</Th>
          <Th>Contact</Th>
          <Th>Terms</Th>
          <Th align="right">Open</Th>
          <Th align="right">Receivables</Th>
          <Th>Last order</Th>
          <Th className="w-28 pl-6">Credit</Th>
        </ColumnHeaders>

        <TBody>
          {rows.map((customer) => (
            <Tr key={customer.id}>
              <Td className="pl-3">
                <Link to={`/sales/customers/${customer.id}`} className="text-accent hover:underline">
                  {customer.name}
                </Link>
              </Td>
              <Td className="text-ink-muted">{customer.contact}</Td>
              <Td>
                <span className="figure text-ink-muted">{customer.terms}</span>
              </Td>
              <Td align="right">
                <Figure value={customer.openOrders} kind="quantity" tone="muted" />
              </Td>
              <Td align="right">
                <Figure value={customer.receivables} />
              </Td>
              <Td>
                <span className="figure text-ink-muted">{customer.lastOrder}</span>
              </Td>
              <Td className="pl-6">
                <StatusPill status={customer.creditStatus} label={customer.credit} />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      {rows.length === 0 && (
        <EmptyState title="No customers here" detail="Nothing matches this filter." />
      )}
    </div>
  )
}
