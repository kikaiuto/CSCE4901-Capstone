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
import { products, productTotals, type StockState } from '../fixtures/products'

type Filter = StockState | 'all'

const TABS: readonly TabItem<Filter>[] = [
  { id: 'all', label: 'All', count: products.length },
  { id: 'ok', label: 'In stock', count: products.filter((p) => p.state === 'ok').length },
  { id: 'low', label: 'Below safety', count: products.filter((p) => p.state === 'low').length },
  { id: 'out', label: 'Out of stock', count: products.filter((p) => p.state === 'out').length },
]

const STATE_LABEL: Record<StockState, 'active' | 'submitted' | 'cancelled'> = {
  ok: 'active',
  low: 'submitted',
  out: 'cancelled',
}

export function ProductsScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const fresh = useFirstVisit('inventory/products')

  const rows = useMemo(
    () => (filter === 'all' ? products : products.filter((product) => product.state === filter)),
    [filter],
  )

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title="Products"
        actions={
          <Button variant="primary" unwired>
            New product
          </Button>
        }
      />

      <Tabs items={TABS} active={filter} onChange={setFilter} className="mt-6" />

      <div className="flex items-center gap-2.5 py-4">
        <SelectShell value="Category" unwired />
        <SelectShell value="Warehouse" unwired />

        <div className="ml-auto flex items-center gap-3">
          <p className="text-base text-ink-muted">
            {countOf(productTotals.count, 'product')} ·{' '}
            <Figure value={productTotals.stockValue} kind="money" tone="muted" />
          </p>
          <Button unwired>Export</Button>
        </div>
      </div>

      <Table>
        <ColumnHeaders>
          <Th className="pl-3">SKU</Th>
          <Th>Name</Th>
          <Th>Category</Th>
          <Th align="right">On hand</Th>
          <Th align="right">Available</Th>
          <Th align="right">Avg cost</Th>
          <Th className="w-32 pl-6">Stock</Th>
        </ColumnHeaders>

        <TBody>
          {rows.map((product) => (
            <Tr key={product.id}>
              <Td className="pl-3">
                <Link
                  to={`/inventory/products/${product.sku}`}
                  className="figure text-accent hover:underline"
                >
                  {product.sku}
                </Link>
              </Td>
              <Td>{product.name}</Td>
              <Td className="text-ink-muted">{product.category}</Td>
              <Td align="right">
                <Figure
                  value={product.onHand}
                  kind="quantity"
                  tone={product.state === 'out' ? 'negative' : 'default'}
                />
              </Td>
              <Td align="right">
                <Figure value={product.available} kind="quantity" tone="muted" />
              </Td>
              <Td align="right">
                <Figure value={product.avgCost} places={4} tone="muted" />
              </Td>
              <Td className="pl-6">
                <StatusPill status={STATE_LABEL[product.state]} />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      {rows.length === 0 && (
        <EmptyState title="No products here" detail="Nothing matches this stock filter." />
      )}
    </div>
  )
}
