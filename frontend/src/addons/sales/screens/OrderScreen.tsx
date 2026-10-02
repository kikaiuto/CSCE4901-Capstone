import { Link, useParams } from 'react-router'
import { ActionBar } from '@/core/components/ui/ActionBar'
import { Button } from '@/core/components/ui/Button'
import { Card } from '@/core/components/ui/Card'
import { EmptyState } from '@/core/components/ui/EmptyState'
import { Figure } from '@/core/components/ui/Figure'
import { ColumnHeaders, Table, TBody, Td, Th, Tr } from '@/core/components/ui/Table'
import { cn } from '@/core/lib/cn'
import { useFirstVisit } from '@/core/lib/useFirstVisit'
import { useRecordPager } from '@/core/app/useRecordPager'
import { orderDetails, salesOrders } from '../fixtures/orders'
import { customers } from '../fixtures/customers'
import { SideEffectList } from '../components/SideEffectList'

const STAMP: Record<string, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

export function OrderScreen() {
  const { number } = useParams()
  const order = salesOrders.find((row) => row.number === number)
  const detail = number ? orderDetails[number] : undefined
  const fresh = useFirstVisit(`sales/orders/${number}`)

  useRecordPager(
    salesOrders,
    (row) => row.number === number,
    (row) => `/sales/orders/${row.number}`,
    'order',
  )

  if (!order || !detail) {
    return <EmptyState title="No such order" detail={`Nothing matches ${number}.`} />
  }

  const problem = detail.problems[0]
  const customer = customers.find((row) => row.name === detail.billTo)

  return (
    <div className={cn(fresh && 'rise')}>
      <div className="flex gap-8">
        <div className="min-w-0 flex-1">
        <Card className="px-8 py-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="section-label">Sales order</p>
              <h1 className="figure mt-2 text-3xl tracking-tight">{order.number}</h1>
            </div>
            <p
              aria-label={`Status ${STAMP[order.status]}`}
              className="figure -rotate-3 border-2 border-line-strong px-3 py-1 text-sm tracking-widest text-ink-muted uppercase"
            >
              {STAMP[order.status]}
            </p>
          </div>

          <dl className="mt-7 flex flex-wrap gap-x-14 gap-y-4">
            <div>
              <dt className="section-label">Bill to</dt>
              <dd className="mt-1.5 text-base">
                {customer ? (
                  <Link to={`/sales/customers/${customer.id}`} className="text-accent hover:underline">
                    {detail.billTo}
                  </Link>
                ) : (
                  detail.billTo
                )}
              </dd>
              <dd className="text-xs text-ink-faint">Credit: {detail.credit}</dd>
            </div>
            <div>
              <dt className="section-label">Date</dt>
              <dd className="figure mt-1.5 text-base">{order.date}</dd>
            </div>
            <div>
              <dt className="section-label">Owner</dt>
              <dd className="mt-1.5 text-base">{order.owner}</dd>
            </div>
          </dl>

          <Table className="mt-8">
            <ColumnHeaders>
              <Th>Item</Th>
              <Th align="right">Qty</Th>
              <Th align="right">Price</Th>
              <Th align="right">Amount</Th>
            </ColumnHeaders>

            <TBody>
              {detail.lines.map((line) => (
                <Tr key={line.id}>
                  <Td>
                    <span className="text-base">{line.name}</span>{' '}
                    <span className="figure text-ink-faint">{line.sku}</span>
                    {line.shortage && (
                      <p className="mt-0.5 text-xs text-negative">{line.shortage}</p>
                    )}
                  </Td>
                  <Td align="right">
                    <Figure value={line.qty} kind="quantity" />
                  </Td>
                  <Td align="right">
                    <Figure value={line.price} />
                  </Td>
                  <Td align="right">
                    <Figure value={line.amount} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <button
            type="button"
            aria-disabled="true"
            title="Not wired up yet"
            className="mt-4 text-base text-accent"
          >
            + Add item
          </button>

          <dl className="mt-8 ml-auto w-72 space-y-2.5">
            <div className="flex justify-between">
              <dt className="text-base text-ink-muted">Subtotal</dt>
              <dd>
                <Figure value={detail.subtotal} tone="muted" />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-base text-ink-muted">Tax</dt>
              <dd>
                <Figure value={detail.tax} tone="muted" />
              </dd>
            </div>
            <div className="flex justify-between border-t border-line-strong pt-2.5">
              <dt className="text-base font-medium">Total USD</dt>
              <dd>
                <Figure value={detail.total} className="font-medium" />
              </dd>
            </div>
          </dl>
          </Card>
        </div>

        <aside className="w-80 shrink-0 pt-1">
          <h2 className="section-label">What this order will do</h2>
          <SideEffectList steps={detail.sideEffects} />
        </aside>
      </div>

      <ActionBar
        preview={
          problem && (
            <span className="flex items-center gap-2.5">
              <span aria-hidden className="size-1.5 rounded-full bg-negative" />
              <span className="text-ink">{problem.message}</span>
              <button
                type="button"
                aria-disabled="true"
                title="Not wired up yet"
                className="text-accent"
              >
                {problem.fix}
              </button>
            </span>
          )
        }
      >
        <Button unwired>Save draft</Button>
        <Button variant="primary" shortcut="⌘↵" unwired>
          Confirm order
        </Button>
      </ActionBar>
    </div>
  )
}
