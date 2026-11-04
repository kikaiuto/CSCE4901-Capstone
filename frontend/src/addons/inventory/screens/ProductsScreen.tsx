import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { SelectShell } from '@/core/components/ui/Field'
import { Figure } from '@/core/components/ui/Figure'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { countOf } from '@/core/lib/text'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { categoryNames, useCategories, useProducts } from '../hooks/useCatalog'

function NotTracked() {
  return (
    <span aria-label="Not tracked yet" className="text-ink-faint">
      —
    </span>
  )
}

export function ProductsScreen() {
  const navigate = useNavigate()
  const fresh = useFirstVisit('inventory/products')
  const products = useProducts()
  const categories = useCategories()
  const names = useMemo(() => categoryNames(categories.items), [categories.items])

  const newProduct = (
    <Button variant="primary" onClick={() => navigate('/inventory/products/new')}>
      New product
    </Button>
  )

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title="Products"
        meta={
          !products.loading && (
            <p className="text-base text-ink-muted">{countOf(products.items.length, 'product')}</p>
          )
        }
        actions={newProduct}
      />

      <div className="flex items-center gap-2.5 py-4">
        <SelectShell value="Category" unwired />
        <SelectShell value="Warehouse" unwired />

        <div className="ml-auto">
          <Button unwired>Export</Button>
        </div>
      </div>

      {products.error && (
        <p role="alert" className="mb-4 text-base text-negative">
          {products.error}
        </p>
      )}

      {products.loading && (
        <p role="status" className="py-4 text-base text-ink-muted">
          Loading products…
        </p>
      )}

      {!products.loading && !products.error && (
        <Table>
          <ColumnHeaders>
            <Th className="pl-3">SKU</Th>
            <Th>Name</Th>
            <Th>Category</Th>
            <Th align="right">On hand</Th>
            <Th align="right">Available</Th>
            <Th align="right">Avg cost</Th>
            <Th align="right" className="pr-3">
              Unit price
            </Th>
          </ColumnHeaders>

          <TBody>
            {products.items.map((product) => (
              <Tr key={product.product_id}>
                <Td className="pl-3">
                  <Link
                    to={`/inventory/products/${product.sku}`}
                    className="figure text-accent hover:underline"
                  >
                    {product.sku}
                  </Link>
                </Td>
                <Td>{product.name}</Td>
                <Td className="text-ink-muted">{names.get(product.category_id) ?? '—'}</Td>
                <Td align="right">
                  <NotTracked />
                </Td>
                <Td align="right">
                  <NotTracked />
                </Td>
                <Td align="right">
                  <Figure value={product.average_cost} places={4} tone="muted" />
                </Td>
                <Td align="right" className="pr-3">
                  <Figure value={product.unit_price} kind="money" />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      {!products.loading && !products.error && products.items.length === 0 && (
        <EmptyState
          title="No products yet"
          detail="Add the first product to start tracking stock."
          action={newProduct}
        />
      )}
    </div>
  )
}
