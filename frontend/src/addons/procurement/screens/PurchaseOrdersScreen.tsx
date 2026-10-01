import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Figure } from '@/core/components/ui/Figure'
import { SelectShell } from '@/core/components/ui/Field'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { Tabs, type TabItem } from '@/core/components/ui/Tabs'
import { cn } from '@/core/lib/cn'
import { countOf } from '@/core/lib/text'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import {
  purchaseOrders,
  purchaseOrderTotals,
  statusCounts,
  type PurchaseOrderStatus,
} from '../fixtures/purchaseOrders'

type Filter = PurchaseOrderStatus | 'all'

const TABS: readonly TabItem<Filter>[] = [
  { id: 'all', label: 'All', count: statusCounts.all },
  { id: 'draft', label: 'Draft', count: statusCounts.draft },
  { id: 'submitted', label: 'Submitted', count: statusCounts.submitted },
  { id: 'received', label: 'Received', count: statusCounts.received },
  { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
]

export function PurchaseOrdersScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const fresh = useFirstVisit('procurement/orders')

  const rows = useMemo(
    () => (filter === 'all' ? purchaseOrders : purchaseOrders.filter((order) => order.status === filter)),
    [filter],
  )

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title="Purchase orders"
        actions={
          <Button variant="primary" unwired>
            New purchase order
          </Button>
        }
      />

      <Tabs items={TABS} active={filter} onChange={setFilter} className="mt-6" />

      <div className="flex items-center gap-2.5 py-4">
        <SelectShell value="Supplier" unwired />
        <SelectShell value="Expected" unwired />

        <div className="ml-auto flex items-center gap-3">
          <p className="text-base text-ink-muted">
            {countOf(purchaseOrderTotals.count, 'order')} ·{' '}
            <Figure value={purchaseOrderTotals.value} kind="money" tone="muted" />
          </p>
          <Button unwired>Export</Button>
        </div>
      </div>

      <Table>
        <ColumnHeaders>
          <Th className="pl-3">Number</Th>
          <Th>Supplier</Th>
          <Th>Expected</Th>
          <Th align="right">Lines</Th>
          <Th align="right">Value</Th>
          <Th className="w-32 pl-6">Status</Th>
        </ColumnHeaders>

        <TBody>
          {rows.map((order) => (
            <Tr key={order.id}>
              <Td className="pl-3">
                <Link
                  to={`/procurement/orders/${order.number}`}
                  className="figure text-accent hover:underline"
                >
                  {order.number}
                </Link>
              </Td>
              <Td>{order.supplier}</Td>
              <Td>
                <span className="figure text-ink-muted">{order.expected}</span>
              </Td>
              <Td align="right">
                <Figure value={String(order.lines)} kind="quantity" tone="muted" />
              </Td>
              <Td align="right">
                <Figure value={order.value} kind="money" />
              </Td>
              <Td className="pl-6">
                <StatusPill status={order.status} />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      {rows.length === 0 && (
        <EmptyState title="No purchase orders here" detail="Nothing matches this stage." />
      )}
    </div>
  )
}
