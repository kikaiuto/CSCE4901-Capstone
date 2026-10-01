import { useMemo, useState } from 'react'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { BulkAction, BulkBar } from '@/core/components/ui/BulkBar'
import { Checkbox } from '@/core/components/ui/Checkbox'
import { Figure } from '@/core/components/ui/Figure'
import { SelectShell } from '@/core/components/ui/Field'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { Tabs, type TabItem } from '@/core/components/ui/Tabs'
import { useSelection } from '@/core/lib/useSelection'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { countOf } from '@/core/lib/text'
import { orderTotals, salesOrders, statusCounts, type OrderStatus } from '@/addons/sales/fixtures/orders'

type Filter = OrderStatus | 'all'

const TABS: readonly TabItem<Filter>[] = [
  { id: 'all', label: 'All', count: statusCounts.all },
  { id: 'draft', label: 'Draft', count: statusCounts.draft },
  { id: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
  { id: 'fulfilled', label: 'Fulfilled', count: statusCounts.fulfilled },
  { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
]

export function OrdersScreen() {
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(
    () => (filter === 'all' ? salesOrders : salesOrders.filter((order) => order.status === filter)),
    [filter],
  )

  const ids = useMemo(() => rows.map((order) => order.id), [rows])
  const selection = useSelection(ids)
  const fresh = useFirstVisit('sales/orders')

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-24')}>
      <PageHeader
        title="Orders"
        actions={
          <Button variant="primary" shortcut="N" unwired>
            New order
          </Button>
        }
      />

      <Tabs items={TABS} active={filter} onChange={setFilter} className="mt-6" />

      <div className="flex items-center gap-2.5 py-4">
        <SelectShell value="Last 30 days" unwired />
        <SelectShell value="Customer" unwired />
        <SelectShell value="Owner" unwired />
        <button
          type="button"
          aria-disabled="true"
          title="Not wired up yet"
          className="px-1.5 text-base text-accent"
        >
          + Filter
        </button>

        <div className="ml-auto flex items-center gap-3">
          <p className="text-base text-ink-muted">
            {countOf(orderTotals.count, 'order')} ·{' '}
            <Figure value={orderTotals.value} kind="money" tone="muted" />
          </p>
          <SelectShell value="Columns" unwired />
          <Button unwired>Export</Button>
        </div>
      </div>

      <Table>
        <ColumnHeaders>
          <Th className="w-10 pl-4">
            <Checkbox
              checked={selection.allSelected}
              indeterminate={selection.someSelected}
              onChange={selection.toggleAll}
              label="Select every order"
            />
          </Th>
          <Th>Number</Th>
          <Th>Customer</Th>
          <Th>Date</Th>
          <Th align="right">Total</Th>
          <Th className="w-32 pl-6">Status</Th>
        </ColumnHeaders>

        <TBody>
          {rows.map((order) => (
            <Tr key={order.id} selected={selection.isSelected(order.id)}>
              <Td className="pl-4">
                <Checkbox
                  checked={selection.isSelected(order.id)}
                  onChange={() => selection.toggle(order.id)}
                  label={`Select ${order.number}`}
                />
              </Td>
              <Td>
                <span className="figure">{order.number}</span>
              </Td>
              <Td>{order.customer}</Td>
              <Td>
                <span className="figure text-ink-muted">{order.date}</span>
              </Td>
              <Td align="right">
                <Figure value={order.total} />
              </Td>
              <Td className="pl-6">
                <StatusPill status={order.status} />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      {rows.length === 0 && (
        <EmptyState title="No orders here" detail="Nothing matches this stage." />
      )}

      <BulkBar count={selection.count} onDismiss={selection.clear}>
        <BulkAction unwired>Confirm</BulkAction>
        <BulkAction unwired>Cancel</BulkAction>
        <BulkAction unwired>Export</BulkAction>
      </BulkBar>
    </div>
  )
}
