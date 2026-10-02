import { Link, useParams } from 'react-router'
import { Button } from '@/core/components/ui/Button'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Figure } from '@/core/components/ui/Figure'
import { PageHeader } from '@/core/components/ui/PageHeader'
import { StatTile } from '@/core/components/ui/StatTile'
import { StatusPill } from '@/core/components/ui/StatusPill'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { ChartCard, ComparisonBars, chartColor } from '@/core/components/charts'
import { cn } from '@/core/lib/cn'
import { money } from '@/core/lib/decimal'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { useRecordPager } from '@/core/app/useRecordPager'
import { customers } from '../fixtures/customers'

export function CustomerScreen() {
  const { id } = useParams()
  const customer = customers.find((row) => row.id === id)
  const fresh = useFirstVisit(`sales/customer/${id}`)

  useRecordPager(
    customers,
    (row) => row.id === id,
    (row) => `/sales/customers/${row.id}`,
    'customer',
  )

  if (!customer) {
    return <EmptyState title="No such customer" detail={`Nothing matches ${id}.`} />
  }

  return (
    <div className={cn(fresh && 'rise', 'mx-auto max-w-6xl pb-16')}>
      <PageHeader
        title={customer.name}
        meta={
          <>
            <span className="text-base text-ink-muted">{customer.contact}</span>
            <span className="figure text-xs text-ink-faint">{customer.email}</span>
            <span className="figure text-xs text-ink-faint">{customer.terms}</span>
            <StatusPill status={customer.creditStatus} label={customer.credit} />
          </>
        }
        actions={
          <Button variant="primary" shortcut="N" unwired>
            New order
          </Button>
        }
      />

      <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line py-6 sm:grid-cols-4">
        <StatTile
          label="Open orders"
          value={customer.openOrders}
          kind="quantity"
          detail="not yet fulfilled"
        />
        <StatTile
          label="Receivables"
          value={customer.receivables}
          tone={Number(customer.receivables) > 0 ? 'negative' : 'default'}
          detail={customer.terms}
        />
        <StatTile label="Lifetime value" value={customer.lifetime} detail="all posted orders" />
        <StatTile label="Average order" value={customer.averageOrder} detail="last 12 months" />
      </dl>

      <section className="mt-9">
        <h2 className="section-label">Open documents for this customer</h2>

        <Table className="mt-3">
          <ColumnHeaders>
            <Th className="pl-3">Document</Th>
            <Th>Date</Th>
            <Th align="right">Amount</Th>
            <Th className="w-32 pl-6">Status</Th>
            <Th align="right" className="w-28">
              Action
            </Th>
          </ColumnHeaders>
          <TBody>
            {customer.documents.map((doc) => (
              <Tr key={doc.id}>
                <Td className="pl-3">
                  <Link
                    to={`/sales/orders/${doc.document}`}
                    className="figure text-accent hover:underline"
                  >
                    {doc.document}
                  </Link>
                </Td>
                <Td>
                  <span className="figure text-ink-muted">{doc.date}</span>
                </Td>
                <Td align="right">
                  <Figure value={doc.amount} />
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

      <ChartCard
        className="mt-9"
        title="Order value · 12 months"
        description={`Monthly order value for ${customer.name} over the last twelve months`}
        height={220}
        series={[{ key: 'value', label: 'Order value', color: chartColor.current, shape: 'bar' }]}
        table={{
          caption: `Monthly order value for ${customer.name}`,
          categoryLabel: 'Month',
          categories: customer.history.map((point) => point.label),
          rows: [
            {
              key: 'value',
              label: 'Order value',
              values: customer.history.map((point) => money(String(point.value))),
            },
          ],
        }}
      >
        <ComparisonBars
          data={customer.history}
          series={[{ key: 'value', label: 'Order value', color: chartColor.current, shape: 'bar' }]}
          format={(value) => money(String(value), { places: 0 })}
        />
      </ChartCard>
    </div>
  )
}
