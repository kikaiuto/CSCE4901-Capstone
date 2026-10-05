import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { ActionBar } from '@/core/components/ui/ActionBar'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Figure } from '@/core/components/ui/Figure'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { SegmentedControl } from '@/core/components/ui/SegmentedControl'
import { StatTile } from '@/core/components/ui/StatTile'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { ChartCard, StepAreaChart, chartColor, type StockPoint } from '@/core/components/charts'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { overlayFor } from '@/core/app/overlays'
import { useRecordPager } from '@/core/app/useRecordPager'
import { products } from '../fixtures/products'
import { openDocuments, stockLedger, stockSeries, todayLabel, type StockWindow } from '../fixtures/stock'

const WINDOWS = [
  { id: '30D' as const, label: '30D' },
  { id: '60D' as const, label: '60D' },
  { id: '90D' as const, label: '90D' },
]

export function ProductScreen() {
  const { sku } = useParams()
  const [range, setRange] = useState<StockWindow>('60D')
  const product = products.find((item) => item.sku === sku)
  const fresh = useFirstVisit(`inventory/product/${sku}`)

  useRecordPager(
    products,
    (row) => row.sku === sku,
    (row) => `/inventory/products/${row.sku}`,
    'product',
  )

  const overlay = overlayFor('S-05')

  const data = useMemo(() => {
    const history = stockSeries[range].map((point) => ({ ...point }) as Record<string, unknown>)
    const byLabel = new Map(history.map((point) => [point.label as string, point]))

    for (const row of overlay?.rows(range) ?? []) {
      const existing = byLabel.get(row.label)
      if (existing) Object.assign(existing, row)
      else history.push({ ...row })
    }

    return history as StockPoint[]
  }, [range, overlay])

  if (!product) {
    return <EmptyState title="No such product" detail={`Nothing in the catalog matches ${sku}.`} />
  }

  const belowSafety = Number(product.onHand) < Number(product.safetyStock)

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title={product.name}
        meta={<span className="figure text-md text-ink-muted">{product.sku}</span>}
      />

      <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line py-6 sm:grid-cols-6">
        <StatTile
          label="On hand"
          value={product.onHand}
          kind="quantity"
          tone={belowSafety ? 'negative' : 'default'}
          detail={belowSafety ? `below safety ${product.safetyStock}` : 'above safety stock'}
        />
        <StatTile label="Committed" value={product.committed} kind="quantity" detail="confirmed orders" />
        <StatTile label="Available" value={product.available} kind="quantity" detail="on hand − committed" />
        <StatTile label="Incoming" value={product.incoming} kind="quantity" detail="PO-0214 · Sep 28" />
        <StatTile label="Moving avg cost" value={product.avgCost} places={4} detail="updated Sep 12" />
        <StatTile label="Unit price" value={product.unitPrice} detail="50.7% margin" />
      </dl>

      <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title={`Stock on hand · ${range}`}
          description={`Units on hand over the last ${range}, with the forecast after today and the safety stock level`}
          height={240}
          controls={
            <SegmentedControl
              options={WINDOWS}
              value={range}
              onChange={setRange}
              label="Chart range"
            />
          }
          series={[
            { key: 'onHand', label: 'On hand', color: chartColor.current, shape: 'line' },
            { key: 'projected', label: 'Forecast', color: chartColor.highlight, shape: 'dashed' },
            { key: 'safety', label: 'Safety stock', color: 'var(--color-negative)', shape: 'dashed' },
          ]}
          table={{
            caption: `Stock on hand over ${range}`,
            categoryLabel: 'Date',
            categories: stockSeries[range].map((point) => point.label),
            rows: [
              {
                key: 'onHand',
                label: 'On hand',
                values: stockSeries[range].map((point) => String(point.onHand)),
              },
            ],
          }}
        >
          <StepAreaChart
            data={data}
            color={chartColor.current}
            format={String}
            safetyStock={Number(product.safetyStock)}
            safetyColor="var(--color-negative)"
            todayLabel={todayLabel}
            riskFrom={overlay?.risk?.from}
            riskTo={overlay?.risk?.to}
            riskColor="var(--color-negative)"
            overlay={overlay?.spec}
          />
        </ChartCard>

        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="section-label">Stock ledger</h2>
            <span className="text-micro text-ink-faint">Append-only</span>
          </div>

          <Table className="mt-3">
            <ColumnHeaders>
              <Th className="pl-0">Date</Th>
              <Th>Source</Th>
              <Th align="right">Δ</Th>
              <Th align="right" className="pr-0">
                Bal
              </Th>
            </ColumnHeaders>
            <TBody>
              {stockLedger.map((entry) => (
                <Tr key={entry.id}>
                  <Td className="pl-0">
                    <span className="figure text-ink-muted">{entry.date}</span>
                  </Td>
                  <Td>
                    <span className="figure">{entry.source}</span>
                  </Td>
                  <Td align="right">
                    <Figure value={entry.change} kind="quantity" sign="always" tone="signed" />
                  </Td>
                  <Td align="right" className="pr-0">
                    <Figure value={entry.balance} kind="quantity" />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </section>
      </div>

      <section className="mt-9">
        <h2 className="section-label">Open documents for this item</h2>

        <Table className="mt-3">
          <ColumnHeaders>
            <Th className="pl-3">Document</Th>
            <Th>Party</Th>
            <Th>Expected</Th>
            <Th align="right">Qty</Th>
            <Th className="w-32 pl-6">Status</Th>
            <Th align="right" className="w-28">
              Action
            </Th>
          </ColumnHeaders>
          <TBody>
            {openDocuments.map((doc) => (
              <Tr key={doc.id}>
                <Td className="pl-3">
                  <span className="figure">{doc.document}</span>
                </Td>
                <Td>{doc.party}</Td>
                <Td>
                  <span className="figure text-ink-muted">{doc.expected}</span>
                </Td>
                <Td align="right">
                  <Figure value={doc.quantity} kind="quantity" sign="always" tone="signed" />
                </Td>
                <Td className="pl-6">
                  <StatusPill status={doc.status} />
                </Td>
                <Td align="right">
                  <button
                    type="button"
                    aria-disabled="true"
                    title="Not wired up yet"
                    className="text-base text-accent"
                  >
                    {doc.action}
                  </button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </section>

      <ActionBar
        preview={
          <span>
            On hand <Figure value={product.onHand} kind="quantity" tone="muted" /> · available{' '}
            <Figure value={product.available} kind="quantity" tone="muted" /> · safety{' '}
            <Figure value={product.safetyStock} kind="quantity" tone="muted" />
          </span>
        }
      >
        <Button shortcut="A" unwired>
          Adjust
        </Button>
        <Button variant="primary" shortcut="R" unwired>
          Reorder
        </Button>
      </ActionBar>
    </div>
  )
}
